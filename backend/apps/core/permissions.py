"""Mirrors the Laravel `PreventTailleur` middleware: the 'tailleur' role is a
shop-floor tailor who can see clients/orders but not run the business side
(finance, staff, stock, suppliers, pricing, reporting, comms)."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


def _is_tailleur(request) -> bool:
    return getattr(request.user, "role", None) == "tailleur"


class IsNotTailleur(BasePermission):
    """Blocks the whole viewset for tailleurs — used by owner-only modules
    (finance, staff, inventory, suppliers, measurement templates, commerce,
    reporting, communications, invoicing)."""

    message = "Cette section n'est pas accessible à votre rôle."

    def has_permission(self, request, view) -> bool:
        return not _is_tailleur(request)


class ReadOnlyForTailleur(BasePermission):
    """Tailleurs can list/retrieve but not create/update/delete — used by
    Orders, where a tailleur may only consult the order, not edit it."""

    message = "Votre rôle ne permet pas de modifier cette ressource."

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return not _is_tailleur(request)


class DenyTailleurDestroy(BasePermission):
    """Tailleurs can manage clients but not delete them (the only Laravel
    route wrapped in prevent.tailleur for the clients module)."""

    message = "Votre rôle ne permet pas de supprimer cette ressource."

    def has_permission(self, request, view) -> bool:
        if getattr(view, "action", None) == "destroy":
            return not _is_tailleur(request)
        return True
