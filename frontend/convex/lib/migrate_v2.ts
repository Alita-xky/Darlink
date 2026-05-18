import { internalMutation } from '../_generated/server';

export const migrateAllToV2 = internalMutation({
  args: {},
  handler: async (ctx) => {
    let qInserted = 0;
    let qSkipped = 0;
    let dhPatched = 0;
    let dhSkipped = 0;

    // 1. studentProfiles → questionnaires (mode='friend')
    const profiles = await ctx.db.query('studentProfiles').collect();
    for (const p of profiles) {
      const existing = await ctx.db
        .query('questionnaires')
        .withIndex('by_user_mode', (i) => i.eq('userId', p.userId).eq('mode', 'friend'))
        .first();
      if (existing) {
        qSkipped++;
        continue;
      }
      await ctx.db.insert('questionnaires', {
        userId: p.userId,
        mode: 'friend',
        background: {
          socialEnergy: p.socialEnergy,
          communicationStyle: p.communicationStyle,
          interests: p.interests,
          availability: p.availability,
        },
        needs: {
          socialGoal: p.socialGoal,
          relationshipPace: p.relationshipPace,
          values: p.values,
        },
        matching: {
          boundaries: p.boundaries,
          preferredScenes: p.preferredScenes,
          dislikeTopics: p.dislikeTopics,
        },
        raw: p.questionnaireAnswers ?? null,
        createdAt: p._creationTime,
      });
      qInserted++;
    }

    // 2. digitalHumans (v1 rows, no mode) → patch with v2 fields, mode='friend'
    const dhs = await ctx.db.query('digitalHumans').collect();
    for (const dh of dhs) {
      if (dh.mode) {
        dhSkipped++;
        continue;
      }
      await ctx.db.patch(dh._id, {
        mode: 'friend',
        systemPrompt: dh.cardText,
        pixelFeatures: null,
        darwinScore: 0,
        darwinIterations: 0,
        createdAt: dh._creationTime,
      });
      dhPatched++;
    }

    return {
      qInserted,
      qSkipped,
      qTotalSource: profiles.length,
      dhPatched,
      dhSkipped,
      dhTotal: dhs.length,
    };
  },
});
