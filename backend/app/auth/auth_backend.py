from fastapi_users.authentication import JWTStrategy, AuthenticationBackend
from fastapi_users.authentication import BearerTransport
import os

SECRET = os.getenv("SECRET_KEY", "super-secret")

bearer_transport = BearerTransport(tokenUrl="auth/signin")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)
