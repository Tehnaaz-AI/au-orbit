import asyncio
import json
import logging
from typing import Dict, Set, AsyncIterator, Optional, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class EventBroadcaster:
    """
    Centralized in-process Pub/Sub Event Broadcaster for Server-Sent Events (SSE).
    
    Architectural Guarantee:
    - Database is the authoritative source of truth.
    - SSE streams live events as they are persisted to the database.
    - Subscribers subscribe to specific incidents or agent runs.
    - Safe for multi-subscriber and disconnect handling.
    """
    def __init__(self):
        self._incident_subscribers: Dict[int, Set[asyncio.Queue]] = {}
        self._run_subscribers: Dict[int, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    def _get_loop(self) -> Optional[asyncio.AbstractEventLoop]:
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            return None

    def broadcast(
        self,
        event_dict: Dict[str, Any],
        incident_id: Optional[int] = None,
        agent_run_id: Optional[int] = None,
        organization_id: Optional[int] = None
    ):
        """
        Broadcast an event to all active subscribers for the given incident and/or agent_run.
        Can be called synchronously from DB transaction hooks or helper functions.
        """
        inc_id = incident_id or event_dict.get("incident_id")
        run_id = agent_run_id or event_dict.get("agent_run_id")

        queues_to_notify = set()

        if inc_id and inc_id in self._incident_subscribers:
            queues_to_notify.update(self._incident_subscribers[inc_id])

        if run_id and run_id in self._run_subscribers:
            queues_to_notify.update(self._run_subscribers[run_id])

        for q in queues_to_notify:
            try:
                q.put_nowait(event_dict)
            except asyncio.QueueFull:
                logger.warning("Subscriber queue is full. Dropping live event.")
            except Exception as e:
                logger.error(f"Error putting event to subscriber queue: {e}")

    async def subscribe_incident(self, incident_id: int) -> AsyncIterator[Dict[str, Any]]:
        """Subscribe to live events for a specific incident."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        
        if incident_id not in self._incident_subscribers:
            self._incident_subscribers[incident_id] = set()
        self._incident_subscribers[incident_id].add(queue)

        try:
            while True:
                # Wait for next event or heartbeat
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield event
                except asyncio.TimeoutError:
                    # Send a heartbeat / keepalive ping
                    yield {"type": "heartbeat", "timestamp": datetime.now(timezone.utc).isoformat()}
        finally:
            if incident_id in self._incident_subscribers:
                self._incident_subscribers[incident_id].discard(queue)
                if not self._incident_subscribers[incident_id]:
                    del self._incident_subscribers[incident_id]

    async def subscribe_run(self, agent_run_id: int) -> AsyncIterator[Dict[str, Any]]:
        """Subscribe to live events for a specific AgentRun."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)

        if agent_run_id not in self._run_subscribers:
            self._run_subscribers[agent_run_id] = set()
        self._run_subscribers[agent_run_id].add(queue)

        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield event
                except asyncio.TimeoutError:
                    yield {"type": "heartbeat", "timestamp": datetime.now(timezone.utc).isoformat()}
        finally:
            if agent_run_id in self._run_subscribers:
                self._run_subscribers[agent_run_id].discard(queue)
                if not self._run_subscribers[agent_run_id]:
                    del self._run_subscribers[agent_run_id]


# Global singleton instance
event_broadcaster = EventBroadcaster()
