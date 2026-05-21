import yaml
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

def load_config() -> dict:
    config_path = BASE_DIR / "config" / "settings.yaml"
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def load_system_prompt(config: dict) -> str:
    prompt_path = BASE_DIR / "config" / "system_prompt.txt"
    with open(prompt_path, "r") as f:
        template = f.read()
    return template.format(
        jurisdiction=config["agent"]["jurisdiction"],
        legal_system=config["agent"]["legal_system"].replace("_", " ").title(),
        language=config["agent"]["language"],
    )

def resolve_path(relative: str) -> Path:
    return (BASE_DIR / relative).resolve()
