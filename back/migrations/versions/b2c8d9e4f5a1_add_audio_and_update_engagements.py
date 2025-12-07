"""add audio and update engagements

Revision ID: b2c8d9e4f5a1
Revises: adf3f0388781
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2c8d9e4f5a1'
down_revision: Union[str, Sequence[str], None] = 'adf3f0388781'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Создаем таблицу audios
    op.create_table('audios',
    sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('url', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Обновляем таблицу engagements:
    # 1. Делаем video_id nullable
    op.alter_column('engagements', 'video_id',
                   existing_type=postgresql.UUID(as_uuid=True),
                   nullable=True)
    
    # 2. Добавляем audio_id (nullable)
    op.add_column('engagements',
                  sa.Column('audio_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # 3. Добавляем внешний ключ для audio_id
    op.create_foreign_key('fk_engagements_audio_id', 'engagements', 'audios',
                         ['audio_id'], ['id'], ondelete='CASCADE')
    
    # 4. Делаем screenshot_url nullable
    op.alter_column('engagements', 'screenshot_url',
                   existing_type=sa.String(length=255),
                   nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Удаляем внешний ключ для audio_id
    op.drop_constraint('fk_engagements_audio_id', 'engagements', type_='foreignkey')
    
    # Удаляем колонку audio_id
    op.drop_column('engagements', 'audio_id')
    
    # Возвращаем video_id как NOT NULL (может вызвать проблемы, если есть NULL значения)
    op.alter_column('engagements', 'video_id',
                   existing_type=postgresql.UUID(as_uuid=True),
                   nullable=False)
    
    # Возвращаем screenshot_url как NOT NULL (может вызвать проблемы, если есть NULL значения)
    op.alter_column('engagements', 'screenshot_url',
                   existing_type=sa.String(length=255),
                   nullable=False)
    
    # Удаляем таблицу audios
    op.drop_table('audios')

