import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_REWARDS } from "@/lib/constants";

const KEY = "auto_mission";
const DAY_MS = 24 * 60 * 60 * 1000;

type Mission = {
  title: string;
  description: string;
  instructions: string;
  difficulty: keyof typeof FALLBACK_REWARDS;
  requiresPhoto: boolean;
};

const MISSIONS: Mission[] = [
  {
    title: "Morning light",
    description: "Start the day with one clear photo of the light outside your window.",
    instructions: "Take the photo after you wake up. Add a short note about how the day feels.",
    difficulty: "easy",
    requiresPhoto: true,
  },
  {
    title: "Ten-minute walk",
    description: "Leave the chair and walk for ten minutes.",
    instructions: "Send a photo from the walk and write where you went.",
    difficulty: "easy",
    requiresPhoto: true,
  },
  {
    title: "One clean surface",
    description: "Clear one desk, shelf, or counter until it looks finished.",
    instructions: "Photo the result. Name the surface in your note.",
    difficulty: "easy",
    requiresPhoto: true,
  },
  {
    title: "Read ten pages",
    description: "Read ten pages of any book, article, or chapter.",
    instructions: "Write the title and one sentence you want to remember. A photo of the page is optional.",
    difficulty: "medium",
    requiresPhoto: false,
  },
  {
    title: "Cook something simple",
    description: "Prepare one meal or snack yourself.",
    instructions: "Photo the plate and note what you made.",
    difficulty: "medium",
    requiresPhoto: true,
  },
  {
    title: "Twenty focused minutes",
    description: "Work on one real task for twenty minutes with no scrolling.",
    instructions: "Write what you finished. No photo required.",
    difficulty: "medium",
    requiresPhoto: false,
  },
  {
    title: "Learn one new thing",
    description: "Learn one fact, word, or skill you did not know yesterday.",
    instructions: "Explain it in two sentences, as if you are teaching a friend.",
    difficulty: "easy",
    requiresPhoto: false,
  },
  {
    title: "Move for fifteen",
    description: "Do fifteen minutes of any workout: walk, stretch, or strength.",
    instructions: "Note the workout. A photo is optional.",
    difficulty: "hard",
    requiresPhoto: false,
  },
  {
    title: "Send a real message",
    description: "Write to someone you appreciate. Make it specific.",
    instructions: "Do not paste the private message. Write who you contacted and why, in one line.",
    difficulty: "easy",
    requiresPhoto: false,
  },
  {
    title: "Sketch for ten",
    description: "Draw anything for ten minutes. Skill does not matter.",
    instructions: "Photo the sketch.",
    difficulty: "medium",
    requiresPhoto: true,
  },
  {
    title: "Water check",
    description: "Drink water through the day and keep a simple count.",
    instructions: "Note how many glasses you finished.",
    difficulty: "easy",
    requiresPhoto: false,
  },
  {
    title: "Help once",
    description: "Do one useful thing for another person.",
    instructions: "Describe what you did. Keep private details out of the note.",
    difficulty: "medium",
    requiresPhoto: false,
  },
  {
    title: "Phone-down half hour",
    description: "Put the phone away for thirty minutes and do something with your hands.",
    instructions: "Write what you did during that half hour.",
    difficulty: "hard",
    requiresPhoto: false,
  },
  {
    title: "Three lines for tomorrow",
    description: "Write three things you will do tomorrow.",
    instructions: "Put all three in the note. Keep them small enough to finish.",
    difficulty: "easy",
    requiresPhoto: false,
  },
  {
    title: "Evening reset",
    description: "Set out what you need for tomorrow before you stop for the night.",
    instructions: "Photo the setup and note the first thing you will do in the morning.",
    difficulty: "medium",
    requiresPhoto: true,
  },
  {
    title: "Forty-five minute forge",
    description: "Give one hard task forty-five minutes of uninterrupted work.",
    instructions: "Name the task and the result. This one pays more.",
    difficulty: "legendary",
    requiresPhoto: false,
  },
];

type AutoState = {
  last_at?: string;
  index?: number;
};

function asState(value: unknown): AutoState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const row = value as AutoState;
  return {
    last_at: typeof row.last_at === "string" ? row.last_at : undefined,
    index: typeof row.index === "number" && Number.isInteger(row.index) && row.index >= 0 ? row.index : 0,
  };
}

export async function publishDueMission() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("settings").select("value").eq("key", KEY).maybeSingle();
    const current = asState(data?.value);
    const last = current.last_at ? new Date(current.last_at).getTime() : 0;
    if (last && Date.now() - last < DAY_MS) return false;

    const now = new Date();
    const index = current.index ?? 0;
    const next = { last_at: now.toISOString(), index: index + 1 };

    if (!data) {
      const { error } = await admin.from("settings").insert({ key: KEY, value: next, updated_at: now.toISOString() });
      if (error) return false;
    } else {
      let update = admin.from("settings").update({ value: next, updated_at: now.toISOString() }).eq("key", KEY);
      update = current.last_at ? update.eq("value->>last_at", current.last_at) : update.filter("value->>last_at", "is", null);
      const { data: claimed } = await update.select("key");
      if (!claimed?.length) return false;
    }

    const mission = MISSIONS[index % MISSIONS.length];
    const reward = FALLBACK_REWARDS[mission.difficulty];
    const { data: task, error } = await admin
      .from("tasks")
      .insert({
        title: mission.title,
        description: mission.description,
        instructions: mission.instructions,
        difficulty: mission.difficulty,
        xp_reward: reward.xp,
        coin_reward: reward.coins,
        deadline: new Date(now.getTime() + DAY_MS).toISOString(),
        requires_photo: mission.requiresPhoto,
        max_submissions: 1,
        allow_resubmission: true,
        is_active: true,
        assign_to: "everyone",
      })
      .select("id")
      .single();

    if (error || !task) {
      await admin.from("settings").update({ value: current, updated_at: now.toISOString() }).eq("key", KEY);
      return false;
    }

    const { data: players } = await admin.from("profiles").select("id");
    if (players?.length) {
      await admin.from("notifications").insert(
        players.map((player) => ({
          user_id: player.id,
          title: "New mission",
          body: `${mission.title} is live for the next 24 hours.`,
          type: "daily_mission",
        })),
      );
    }

    return true;
  } catch {
    return false;
  }
}
