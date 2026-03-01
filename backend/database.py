from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), default="IELTS Candidate")
    target_band = db.Column(db.Float, default=7.5)
    credits = db.Column(db.Integer, default=20)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Submission(db.Model):
    __tablename__ = 'submissions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    task_type = db.Column(db.String(20)) # task1, task2, exercise
    category = db.Column(db.String(50), nullable=True) # for exercises
    subcategory = db.Column(db.String(50), nullable=True) # for exercises
    prompt_text = db.Column(db.Text)
    user_response = db.Column(db.Text)
    overall_band_score = db.Column(db.Float, nullable=True)
    task_completion = db.Column(db.String(20), nullable=True)
    justification = db.Column(db.Text, nullable=True)
    improved_version = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    pillars = db.relationship('PillarScore', backref='submission', cascade="all, delete-orphan")
    errors = db.relationship('ErrorAnnotation', backref='submission', cascade="all, delete-orphan")
    improvement_notes = db.relationship('ImprovementNote', backref='submission', cascade="all, delete-orphan")

class PillarScore(db.Model):
    __tablename__ = 'pillar_scores'
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'))
    name = db.Column(db.String(50))
    score = db.Column(db.Float)
    feedback = db.Column(db.Text)

class ErrorAnnotation(db.Model):
    __tablename__ = 'error_annotations'
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'))
    original = db.Column(db.Text)
    improved = db.Column(db.Text) # Maps to 'suggestion' in schema
    issue = db.Column(db.Text)
    error_type = db.Column(db.String(50))

class ImprovementNote(db.Model):
    __tablename__ = 'improvement_notes'
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'))
    note_type = db.Column(db.String(50)) # rename from type to avoid keyword conflict
    before = db.Column(db.Text)
    after = db.Column(db.Text)
    reason = db.Column(db.Text)

class VaultItem(db.Model):
    __tablename__ = 'learning_vault'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    note_type = db.Column(db.String(50))
    before = db.Column(db.Text)
    after = db.Column(db.Text)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
