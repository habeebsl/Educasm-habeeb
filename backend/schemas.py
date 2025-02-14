from pydantic import BaseModel
from typing import Union

class ModelRequest(BaseModel):
    session_id: str   
    age: int

class PlayGroundQuestionResquest(ModelRequest):
    topic: str
    level: Union[int, float]
    selected_aspect: str
