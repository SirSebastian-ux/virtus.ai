"use client";

const experiences = [
  {
    id: "guidance",
    title: "Get Guidance",
    prompt: "I would like thoughtful guidance about something important in my life. Help me clarify the situation and consider my options.",
  },
  {
    id: "habits",
    title: "Build Habits",
    prompt: "Help me build one sustainable habit. Start by asking me about my goal, current routine, and biggest obstacles.",
  },
  {
    id: "ideas",
    title: "Explore Ideas",
    prompt: "I have an idea I want to explore. Help me examine its possibilities, assumptions, and alternatives through critical thinking.",
  },
  {
    id: "challenges",
    title: "Work Through Challenges",
    prompt: "I am facing a challenge. Help me reflect on the situation, understand my responses, and identify practical next steps.",
  },
];

function ExperienceIcon({ id }) {
  return (
    <svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      {id === "guidance" && (
        <>
          <circle cx="24" cy="24" r="17" />
          <path d="m30.5 17.5-6.3 13.2-6.7-6.9 13-6.3Z" />
          <path d="m23.8 30.7.4-6.4 6.3-6.8" />
        </>
      )}
      {id === "habits" && (
        <>
          <rect x="9" y="27" width="6.5" height="12" rx="1.5" />
          <rect x="20.5" y="19" width="6.5" height="20" rx="1.5" />
          <rect x="32" y="10" width="6.5" height="29" rx="1.5" />
        </>
      )}
      {id === "ideas" && (
        <>
          <path d="M16 31.3c-3.6-2.5-5.7-6.6-5.2-11 .6-6.9 6-12 13-12.2 7.5-.3 13.8 5.8 13.8 13.3 0 4.2-2 7.8-5.5 10.2-1.6 1.1-2.4 3-2.4 5v1.6H18v-1.6c0-2.2-.6-4.2-2-5.3Z" />
          <path d="M19 39h10M20.5 43h7" />
        </>
      )}
      {id === "challenges" && (
        <>
          <circle cx="16" cy="18" r="6.5" />
          <circle cx="33" cy="18" r="6.5" />
          <path d="M4 38v-4c0-5.1 4.9-8.5 12-8.5s12 3.4 12 8.5v4H4ZM27.5 27.5c6.8-1 15.5 1.2 15.5 8V38h-11" />
        </>
      )}
    </svg>
  );
}

export default function LuxuryWelcome({ onSelectPrompt, disabled = false }) {
  return (
    <section className="virtus-luxury-hero" aria-labelledby="virtus-luxury-welcome-title">
      <p className="virtus-luxury-eyebrow">Your personal development space</p>
      <div className="virtus-luxury-divider" aria-hidden="true"><span>✦</span></div>
      <h1 id="virtus-luxury-welcome-title" className="virtus-luxury-heading">
        What would you like to explore <span>today?</span>
      </h1>
      <p className="virtus-luxury-description">
        Get guidance, explore ideas, build better habits, or work through
        challenges with a thoughtful AI partner.
      </p>
      <div className="virtus-luxury-experiences">
        {experiences.map((experience) => (
          <button
            key={experience.id}
            type="button"
            className="virtus-luxury-experience"
            disabled={disabled}
            onClick={() => onSelectPrompt?.(experience.prompt)}
            aria-label={experience.title}
          >
            <span className="virtus-luxury-experience-icon">
              <ExperienceIcon id={experience.id} />
            </span>
            <span className="virtus-luxury-experience-title">{experience.title}</span>
            <span className="virtus-luxury-experience-rule" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
