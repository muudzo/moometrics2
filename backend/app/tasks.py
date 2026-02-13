import time
import json
import logging
from celery.signals import task_failure
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import FailedTask

logger = logging.getLogger(__name__)

@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None, args=None, kwargs=None, **extra):
    """
    Signal handler to persist failed task metadata to the database (DLQ).
    """
    db = SessionLocal()
    try:
        failed_task = FailedTask(
            task_id=task_id,
            payload=json.dumps({"args": args, "kwargs": kwargs}),
            exception=str(exception),
            retry_count=extra.get('retries', 0)
        )
        db.add(failed_task)
        db.commit()
        logger.error(f"Task {task_id} failed permanently and was moved to DLQ.")
    except Exception as e:
        logger.error(f"Error persisting failed task to DLQ: {e}")
    finally:
        db.close()

@celery_app.task(
    bind=True, 
    name="generate_report_task",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=5
)
def generate_report_task(self, report_type: str, user_id: int):
    """
    Mock task to simulate heavy report generation.
    """
    logger.info(f"Starting {report_type} report generation for user {user_id}")
    
    # Simulate work
    total_steps = 5
    for i in range(total_steps):
        time.sleep(2)
        self.update_state(state='PROGRESS', meta={'current': i + 1, 'total': total_steps})
        logger.info(f"Report progress: {i+1}/{total_steps}")

    logger.info(f"Report generation complete")
    return {"status": "completed", "report_url": f"/exports/report_{user_id}_{int(time.time())}.pdf"}

@celery_app.task(
    name="ai_prediction_task",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=3
)
def ai_prediction_task(request_data: dict):
    """
    Task to offload AI predictions.
    """
    logger.info(f"Starting AI prediction for {request_data.get('crop_type')}")
    # In a real scenario, we would call the AI service here
    time.sleep(5)
    logger.info("AI prediction complete")
    return {"status": "success", "prediction": "Optimal planting date: 2024-05-20"}
