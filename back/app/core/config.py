from fastapi.templating import Jinja2Templates
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    NODE_ENV: str = "development"

    APP_HOST: str
    APP_PORT: int
    APP_URL: str

   
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    JWT_SECRET: str = "secret"
    JWT_ALGORITHM: str = "HS256"
    
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PWD: str
    DB_NAME: str

    UPLOAD_DIR: str = "uploads"

    @property
    def DATABASE_URL_asyncpg(self):
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PWD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def DATABASE_URL_psycopg(self):
        return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PWD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")


settings = Settings()  # type: ignore
