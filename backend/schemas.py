from typing import Literal
from pydantic import BaseModel, Field, model_validator


class PatientInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=1, le=120)
    gender: Literal['Female', 'Male', 'Other', 'Prefer not to say']
    heart_rate: float = Field(ge=20, le=250)
    systolic_bp: float = Field(ge=50, le=250)
    diastolic_bp: float = Field(ge=30, le=160)
    spo2: float = Field(ge=50, le=100)
    temperature: float = Field(ge=85, le=115)
    glucose: float = Field(ge=20, le=600)
    symptoms: list[Literal['Fever', 'Headache', 'Chest Pain', 'Breathing Difficulty', 'Fatigue', 'Dizziness']] = Field(default_factory=list, max_length=6)

    @model_validator(mode='after')
    def check_values(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError('Name must contain more than whitespace.')
        if self.systolic_bp <= self.diastolic_bp:
            raise ValueError('Systolic pressure must be greater than diastolic pressure.')
        return self
