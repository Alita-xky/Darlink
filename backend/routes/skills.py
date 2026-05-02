from fastapi import APIRouter
from pathlib import Path

from skill_utils import parse_skill_metadata

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SKILLS_DIR = BASE_DIR / ".claude" / "skills"
@router.get('/skills')
async def list_skills():
    if not SKILLS_DIR.exists():
        return {'ok': True, 'skills': []}
    skills = []
    for skill_file in sorted(SKILLS_DIR.glob('*/SKILL.md')):
        skills.append(parse_skill_metadata(skill_file))
    return {'ok': True, 'skills': skills}


@router.get('/skills/{skill_name}')
async def get_skill(skill_name: str):
    skill_file = SKILLS_DIR / skill_name / 'SKILL.md'
    if not skill_file.exists():
        return {'ok': False, 'reason': 'not_found'}
    return {'ok': True, 'skill': parse_skill_metadata(skill_file)}