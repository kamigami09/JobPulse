import click
from flask import current_app
from flask.cli import AppGroup

reminders_cli = AppGroup("reminders", help="Email reminder commands.")


@reminders_cli.command("send-weekly")
@click.option("--dry-run", is_flag=True, default=False, help="Render and log but do not send.")
@click.option("--force", is_flag=True, default=False, help="Bypass 12h idempotency guard.")
def send_weekly(dry_run: bool, force: bool) -> None:
    """Send (or preview) the weekly digest email."""
    from app.services.reminders import send_weekly_digest

    if not current_app.config.get("REMINDERS_ENABLED") and not dry_run and not force:
        click.echo("REMINDERS_ENABLED is not set. Use --dry-run to test or set REMINDERS_ENABLED=true in .env.")
        raise SystemExit(0)

    result = send_weekly_digest(dry_run=dry_run, force=force)
    status = result["status"]
    msg = result["message"]
    jobs = result["job_count"]

    if status == "sent":
        click.echo(f"[OK] Sent — {jobs} job(s) included. {msg}")
    elif status == "dry_run":
        click.echo(f"[DRY RUN] {jobs} job(s) would be included. {msg}")
    elif status == "skipped":
        click.echo(f"[SKIP] {msg}")
    else:
        click.echo(f"[ERROR] {msg}", err=True)
        raise SystemExit(1)
