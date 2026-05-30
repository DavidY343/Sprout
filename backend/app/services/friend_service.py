from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.models.friendship import Friendship
from app.models.user import User


async def send_friend_request(db: AsyncSession, requester_id: int, addressee_email: str) -> dict:
    """Send a friend request by email. Returns the new friendship or raises."""
    # Find target user
    result = await db.execute(select(User).where(User.email == addressee_email))
    addressee = result.scalar_one_or_none()
    if not addressee:
        raise ValueError("No se encontró un usuario con ese email")
    if addressee.user_id == requester_id:
        raise ValueError("No puedes agregarte a ti mismo")

    # Check existing friendship in either direction
    result = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == requester_id, Friendship.addressee_id == addressee.user_id),
                and_(Friendship.requester_id == addressee.user_id, Friendship.addressee_id == requester_id),
            )
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.status == "accepted":
            raise ValueError("Ya sois amigos")
        raise ValueError("Ya existe una solicitud pendiente")

    friendship = Friendship(
        requester_id=requester_id,
        addressee_id=addressee.user_id,
        status="pending",
    )
    db.add(friendship)
    await db.commit()
    await db.refresh(friendship)
    return {
        "friendship_id": friendship.friendship_id,
        "friend_email": addressee.email,
        "friend_id": addressee.user_id,
        "status": "pending",
        "direction": "sent",
        "created_at": friendship.created_at,
    }


async def accept_friend_request(db: AsyncSession, friendship_id: int, user_id: int) -> dict:
    """Accept a pending friend request (only the addressee can accept)."""
    result = await db.execute(
        select(Friendship).where(
            Friendship.friendship_id == friendship_id,
            Friendship.addressee_id == user_id,
            Friendship.status == "pending",
        )
    )
    friendship = result.scalar_one_or_none()
    if not friendship:
        raise ValueError("Solicitud no encontrada")

    friendship.status = "accepted"
    await db.commit()

    # Get requester email
    result = await db.execute(select(User.email).where(User.user_id == friendship.requester_id))
    email = result.scalar_one()
    return {
        "friendship_id": friendship.friendship_id,
        "friend_email": email,
        "friend_id": friendship.requester_id,
        "status": "accepted",
        "direction": "received",
        "created_at": friendship.created_at,
    }


async def reject_or_remove_friend(db: AsyncSession, friendship_id: int, user_id: int):
    """Reject a pending request or remove an existing friend. Either party can do this."""
    result = await db.execute(
        select(Friendship).where(
            Friendship.friendship_id == friendship_id,
            or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
        )
    )
    friendship = result.scalar_one_or_none()
    if not friendship:
        raise ValueError("Solicitud no encontrada")

    await db.delete(friendship)
    await db.commit()


async def get_friends_list(db: AsyncSession, user_id: int) -> list[dict]:
    """Get all friendships (pending + accepted) for a user."""
    result = await db.execute(
        select(Friendship, User.email, User.user_id).join(
            User,
            or_(
                and_(Friendship.addressee_id == User.user_id, Friendship.requester_id == user_id),
                and_(Friendship.requester_id == User.user_id, Friendship.addressee_id == user_id),
            ),
        ).where(
            or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id)
        )
    )
    rows = result.all()
    friends = []
    for friendship, email, friend_user_id in rows:
        friends.append({
            "friendship_id": friendship.friendship_id,
            "friend_email": email,
            "friend_id": friend_user_id,
            "status": friendship.status,
            "direction": "sent" if friendship.requester_id == user_id else "received",
            "created_at": friendship.created_at,
        })
    return friends


async def is_friend(db: AsyncSession, user_id: int, friend_id: int) -> bool:
    """Check if two users are accepted friends."""
    result = await db.execute(
        select(Friendship).where(
            Friendship.status == "accepted",
            or_(
                and_(Friendship.requester_id == user_id, Friendship.addressee_id == friend_id),
                and_(Friendship.requester_id == friend_id, Friendship.addressee_id == user_id),
            ),
        )
    )
    return result.scalar_one_or_none() is not None
