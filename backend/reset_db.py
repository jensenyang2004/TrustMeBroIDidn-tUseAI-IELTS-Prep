import os
from app import app, db
from database import User, Submission, PillarScore, ErrorAnnotation, ImprovementNote, VaultItem

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables with new schema...")
    db.create_all()
    print("Database reset successfully! You can now log in and your credits/history will work.")
