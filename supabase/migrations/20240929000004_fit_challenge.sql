-- =====================================================
-- FIT CHALLENGE SYSTEM MIGRATION
-- =====================================================
-- Migration: 20240929000004_fit_challenge
-- Description: Create fit challenge and wellness tracking tables

-- Fit challenge programs/batches
CREATE TABLE fit_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Program details
    duration_weeks INTEGER DEFAULT 8,
    max_participants INTEGER DEFAULT 100,
    fee DECIMAL(15,2) NOT NULL DEFAULT 600000,

    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,

    -- Locations and trainers
    locations JSON,
    trainers JSON,

    -- Status
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration_open', 'ongoing', 'completed', 'cancelled')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participant registrations
CREATE TABLE fit_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    challenge_id UUID NOT NULL REFERENCES fit_challenges(id) ON DELETE CASCADE,

    -- Registration details
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_reference TEXT,

    -- Initial measurements
    initial_weight DECIMAL(5,2),
    initial_body_fat DECIMAL(5,2),
    initial_muscle_mass DECIMAL(5,2),
    initial_photos JSON,

    -- Goals
    target_weight DECIMAL(5,2),
    target_body_fat DECIMAL(5,2),
    personal_goals TEXT,

    -- Completion status
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'completed', 'dropped_out')),
    completion_date TIMESTAMP WITH TIME ZONE,
    final_score DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, challenge_id)
);

-- Daily check-ins and progress tracking
CREATE TABLE fit_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES fit_participants(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,

    -- Measurements
    weight DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),

    -- Activities
    workout_completed BOOLEAN DEFAULT false,
    workout_type VARCHAR(100),
    workout_duration INTEGER,
    calories_burned INTEGER,

    -- Nutrition
    meals_logged INTEGER DEFAULT 0,
    water_intake DECIMAL(5,2),

    -- Progress photos
    photos JSON,

    -- Notes
    notes TEXT,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),

    -- Points earned
    points_earned INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_id, check_in_date)
);

-- Fit challenge leaderboard
CREATE TABLE fit_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES fit_challenges(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES fit_participants(id) ON DELETE CASCADE,

    -- Scoring
    total_points INTEGER DEFAULT 0,
    weight_loss_score DECIMAL(5,2) DEFAULT 0,
    consistency_score DECIMAL(5,2) DEFAULT 0,
    improvement_score DECIMAL(5,2) DEFAULT 0,

    -- Rankings
    current_rank INTEGER,
    previous_rank INTEGER,

    -- Last updated
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(challenge_id, participant_id)
);

-- Create indexes for fit challenge
CREATE INDEX idx_fit_participants_member_id ON fit_participants(member_id);
CREATE INDEX idx_fit_participants_challenge_id ON fit_participants(challenge_id);
CREATE INDEX idx_fit_checkins_participant_id ON fit_check_ins(participant_id);
CREATE INDEX idx_fit_checkins_date ON fit_check_ins(check_in_date);