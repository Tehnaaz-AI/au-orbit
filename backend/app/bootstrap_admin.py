"""Production First-Admin Bootstrap CLI.

Usage:
    # Non-interactive via environment variables:
    ADMIN_EMAIL="admin@anurag.edu.in" ADMIN_PASSWORD="StrongSecurePassword123!" ADMIN_NAME="Campus Administrator" python -m app.bootstrap_admin

    # Interactive:
    python -m app.bootstrap_admin
"""
import os
import sys
import getpass
from sqlalchemy.orm import Session
from .database import SessionLocal, ensure_schema, engine
from .models import User, Organization
from .auth import hash_password

def bootstrap_admin():
    print("=" * 60)
    print("AUOrbit - Production Administrator Provisioning")
    print("=" * 60)

    ensure_schema(engine)
    db: Session = SessionLocal()

    try:
        # Check if default Organization exists
        org = db.query(Organization).filter(Organization.id == 1).first()
        if not org:
            org = Organization(
                id=1,
                name="Anurag University",
                slug="anurag-univ",
                domain="anurag.edu.in",
                is_active=True
            )
            db.add(org)
            db.commit()
            print("[+] Provisioned default organization: Anurag University")

        # Read admin credentials from environment or interactive input
        email = os.getenv("ADMIN_EMAIL", "").strip().lower()
        password = os.getenv("ADMIN_PASSWORD", "")
        name = os.getenv("ADMIN_NAME", "").strip()
        role = os.getenv("ADMIN_ROLE", "SUPER_ADMIN").strip().upper()

        if role not in ("SUPER_ADMIN", "UNIVERSITY_ADMIN", "ADMIN"):
            role = "SUPER_ADMIN"

        if not email:
            print("\nEnter initial administrator details:")
            email = input("Admin Email: ").strip().lower()

        if not email:
            print("[ERROR] Administrator email cannot be empty.")
            sys.exit(1)

        if not name:
            name = input("Admin Full Name [Default: System Administrator]: ").strip() or "System Administrator"

        if not password:
            password = getpass.getpass("Admin Password (min 8 characters): ")

        if not password or len(password) < 8:
            print("[ERROR] Administrator password must be at least 8 characters.")
            sys.exit(1)

        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"[!] User with email '{email}' already exists (Role: {existing_user.role}).")
            choice = os.getenv("ADMIN_OVERWRITE", "").lower()
            if not choice:
                choice = input("Do you want to update this user to Super Admin and reset password? (y/N): ").strip().lower()
            if choice == "y":
                existing_user.role = role
                existing_user.hashed_password = hash_password(password)
                existing_user.full_name = name
                existing_user.is_active = True
                db.commit()
                print(f"[+] Administrator account '{email}' successfully updated.")
            else:
                print("[-] Bootstrap aborted without modifying existing user.")
                sys.exit(0)
        else:
            admin_user = User(
                organization_id=org.id,
                email=email,
                hashed_password=hash_password(password),
                full_name=name,
                role=role,
                department="Campus Operations & Administration",
                is_active=True,
                avatar_color="#E35336"
            )
            db.add(admin_user)
            db.commit()
            print(f"[+] Initial administrator '{email}' ({role}) successfully created.")

        print("=" * 60)
        print("Bootstrap complete. Admin can now sign in via the AUOrbit interface.")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Administrator bootstrap failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_admin()
