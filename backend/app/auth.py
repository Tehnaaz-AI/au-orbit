import hashlib
import secrets
import base64
import json
import time
from typing import Optional, Set, List
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .config import JWT_SECRET_KEY

# Dynamic secret key loaded from environment
SECRET_KEY = JWT_SECRET_KEY or "auorbit-dev-secret-change-in-production-2026"

ROLE_PERMISSIONS: dict[str, Set[str]] = {
    'STUDENT': {
        'incident:create',
        'incident:read_own',
        'room:read',
        'timetable:read',
        'incident:verify_own',
    },
    'FACULTY': {
        'incident:create',
        'incident:read_dept',
        'incident:read_own',
        'room:read',
        'timetable:read',
        'incident:verify',
    },
    'TECHNICIAN': {
        'incident:read',
        'work_order:read_assigned',
        'work_order:execute',
        'room:read',
        'equipment:read',
    },
    'ADMIN': {
        'incident:create',
        'incident:read',
        'incident:read_all',
        'incident:update',
        'incident:assign',
        'incident:replan',
        'incident:close',
        'work_order:manage',
        'work_order:verify',
        'technician:manage',
        'equipment:manage',
        'timetable:manage',
        'room:manage',
        'user:manage',
        'analytics:read',
        'audit:read',
    },
    'UNIVERSITY_ADMIN': {
        'incident:create',
        'incident:read',
        'incident:read_all',
        'incident:update',
        'incident:assign',
        'incident:replan',
        'incident:close',
        'work_order:manage',
        'work_order:verify',
        'technician:manage',
        'equipment:manage',
        'timetable:manage',
        'room:manage',
        'user:manage',
        'analytics:read',
        'audit:read',
    },
    'SUPER_ADMIN': {
        '*',
    }
}

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt, key_hex = hashed_password.split('$', 1)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

def create_access_token(user_id: int, role: str, email: str, organization_id: int = 1) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "email": email,
        "organization_id": organization_id,
        "exp": int(time.time()) + 86400 * 30  # 30 days
    }
    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip('=')
    
    # Signature
    signature = hashlib.sha256(f"{payload_b64}.{SECRET_KEY}".encode()).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hashlib.sha256(f"{payload_b64}.{SECRET_KEY}".encode()).hexdigest()
        if not secrets.compare_digest(signature, expected_sig):
            return None
            
        # Add padding back if necessary
        pad_len = 4 - (len(payload_b64) % 4)
        if pad_len != 4:
            payload_b64 += '=' * pad_len
            
        payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        payload = json.loads(payload_json)
        
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        return None
    user = db.get(User, payload["user_id"])
    if not user or not user.is_active:
        return None
    return user

def require_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    user = get_current_user(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token."
        )
    return user

def has_permission(user: User, permission: str) -> bool:
    role = user.role.upper()
    perms = ROLE_PERMISSIONS.get(role, set())
    if '*' in perms or permission in perms:
        return True
    return False

def require_permission(permission: str):
    def permission_checker(user: User = Depends(require_user)) -> User:
        if not has_permission(user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Missing required permission '{permission}' for role '{user.role}'."
            )
        return user
    return permission_checker

def require_role(allowed_roles: List[str]):
    def role_checker(user: User = Depends(require_user)) -> User:
        norm_roles = [r.upper() for r in allowed_roles]
        if user.role.upper() not in norm_roles and user.role.upper() != 'SUPER_ADMIN':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user.role}' is not authorized. Requires one of: {allowed_roles}."
            )
        return user
    return role_checker

def get_tenant_org_id(user: User) -> int:
    """Server-authoritative tenant ID derived strictly from authenticated user record."""
    return user.organization_id or 1
