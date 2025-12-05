from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.logger import logger

# alembic_cfg = Config("back/alembic.ini")
alembic_cfg = Config("alembic.ini")
script = ScriptDirectory.from_config(alembic_cfg)


async def upgrade(async_engine: AsyncEngine):
    async with async_engine.begin() as conn:

        def check_revision(sync_conn):
            context = MigrationContext.configure(sync_conn)
            return context.get_current_revision()

        current_rev = await conn.run_sync(check_revision)
        head_rev = script.get_current_head()

        if current_rev != head_rev:
            logger.info(
                f"Current revision: {current_rev}, upgrading to head {head_rev}"
            )
            command.upgrade(alembic_cfg, "head")
        else:
            logger.info("DB already up-to-date")
