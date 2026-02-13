from fastapi import APIRouter, Depends
from app.tasks import generate_report_task, ai_prediction_task
from app.api import deps
from app import models

router = APIRouter()

@router.post("/mock-report")
async def trigger_mock_report(
    report_type: str = "Annual Livestock Summary",
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Trigger a background report generation task.
    """
    task = generate_report_task.delay(report_type, current_user.id)
    return {"message": "Report generation started", "task_id": task.id}

@router.post("/mock-prediction")
async def trigger_mock_prediction(
    crop_type: str = "Maize",
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Trigger a background AI prediction task.
    """
    task = ai_prediction_task.delay({"crop_type": crop_type, "user_id": current_user.id})
    return {"message": "AI prediction started", "task_id": task.id}
