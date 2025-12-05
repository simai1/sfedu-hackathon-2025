from argon2 import PasswordHasher

ph = PasswordHasher()


def hash(plain: str) -> str:
    hashed = ph.hash(plain)
    return hashed


def verify(plain: str, hashed: str) -> bool:
    try:
        ph.verify(hashed, plain)
        return True
    except Exception:
        return False
