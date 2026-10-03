import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { songs, voiceClones, instrumentals, auditLogs, users } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { createStoredAudioPreview } from "./audioPreview";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Módulo de Canciones por IA
  songs: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          genre: z.string().min(1),
          mood: z.string().min(1),
          language: z.string().min(1),
          customPrompt: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const promptText = `Escribe una letra de canción completa de alta calidad en ${input.language}, género ${input.genre}, estado de ánimo ${input.mood}. Título: ${input.title}. ${input.customPrompt ? 'Detalles adicionales: ' + input.customPrompt : ''}`;
        
        let lyrics = "";
        try {
          const llmResult = await invokeLLM({
            messages: [{ role: "user", content: promptText }]
          });
          lyrics = typeof llmResult === 'string' ? llmResult : "Letra generada automáticamente por Sonix Elite AI.";
        } catch (e) {
          lyrics = "Verso 1:\nBajo las luces de la ciudad eterna...\nCoro:\nSomos la élite, somos la creación...";
        }

        const [result] = await db.insert(songs).values({
          userId: ctx.user.id,
          title: input.title,
          genre: input.genre,
          mood: input.mood,
          language: input.language,
          lyrics,
          audioUrl: null,
          audioKey: null,
          status: "processing",
        });

        const audioPreview = await createStoredAudioPreview(
          "songs",
          result.insertId,
          `${ctx.user.id}:${input.title}:${input.genre}:${input.mood}:${input.language}:${input.customPrompt ?? ""}`,
        );
        await db.update(songs).set({
          audioUrl: audioPreview.url,
          audioKey: audioPreview.key,
          status: "completed",
        }).where(eq(songs.id, result.insertId));

        await db.insert(auditLogs).values({
          userId: ctx.user.id,
          action: "SONG_CREATED",
          details: `Canción creada: ${input.title} (${input.genre}, ${input.language})`,
          ipAddress: ctx.req.headers['x-forwarded-for']?.toString() || '127.0.0.1',
        });

        return { success: true, songId: result.insertId, lyrics, audioUrl: audioPreview.url };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(songs).where(eq(songs.userId, ctx.user.id)).orderBy(desc(songs.createdAt));
    }),
  }),

  // Módulo de Clonación de Voz
  voice: router({
    clone: protectedProcedure
      .input(
        z.object({
          voiceName: z.string().min(1),
          sampleUrl: z.string().url(),
          consentAccepted: z.boolean().refine(val => val === true, {
            message: "El consentimiento explícito es obligatorio para clonar voces.",
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const ip = ctx.req.headers['x-forwarded-for']?.toString() || '127.0.0.1';

        const [result] = await db.insert(voiceClones).values({
          userId: ctx.user.id,
          voiceName: input.voiceName,
          sampleUrl: input.sampleUrl,
          sampleKey: "sample_voice_key.wav",
          consentAccepted: 1,
          consentIp: ip,
          status: "ready",
        });

        await db.insert(auditLogs).values({
          userId: ctx.user.id,
          action: "VOICE_CLONE_CONSENT_VERIFIED",
          details: `Voz clonada: ${input.voiceName} con consentimiento IP ${ip}`,
          ipAddress: ip,
        });

        return { success: true, cloneId: result.insertId, status: "ready" };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(voiceClones).where(eq(voiceClones.userId, ctx.user.id)).orderBy(desc(voiceClones.createdAt));
    }),
  }),

  // Módulo de Instrumentales
  instrumentals: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          genre: z.string().min(1),
          bpm: z.number().min(60).max(200),
          keySignature: z.string().min(1),
          instruments: z.string().min(1),
          durationSeconds: z.number().min(30).max(600),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [result] = await db.insert(instrumentals).values({
          userId: ctx.user.id,
          title: input.title,
          genre: input.genre,
          bpm: input.bpm,
          keySignature: input.keySignature,
          instruments: input.instruments,
          durationSeconds: input.durationSeconds,
          audioUrl: null,
          audioKey: null,
          status: "processing",
        });

        const audioPreview = await createStoredAudioPreview(
          "instrumentals",
          result.insertId,
          `${ctx.user.id}:${input.title}:${input.genre}:${input.bpm}:${input.keySignature}:${input.instruments}:${input.durationSeconds}`,
        );
        await db.update(instrumentals).set({
          audioUrl: audioPreview.url,
          audioKey: audioPreview.key,
          status: "completed",
        }).where(eq(instrumentals.id, result.insertId));

        await db.insert(auditLogs).values({
          userId: ctx.user.id,
          action: "INSTRUMENTAL_CREATED",
          details: `Instrumental: ${input.title} (${input.genre}, ${input.bpm} BPM, Tonalidad ${input.keySignature})`,
          ipAddress: ctx.req.headers['x-forwarded-for']?.toString() || '127.0.0.1',
        });

        return { success: true, instrumentalId: result.insertId, audioUrl: audioPreview.url };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(instrumentals).where(eq(instrumentals.userId, ctx.user.id)).orderBy(desc(instrumentals.createdAt));
    }),
  }),

  // Panel de Auditoría y Cumplimiento
  audit: router({
    logs: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      if (ctx.user.role === 'admin') {
        return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      }
      return await db.select().from(auditLogs).where(eq(auditLogs.userId, ctx.user.id)).orderBy(desc(auditLogs.createdAt)).limit(100);
    }),
  }),

  // Panel de Administración
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Acceso denegado. Se requiere rol de administrador.");
      }
      const db = await getDb();
      if (!db) return { usersCount: 0, songsCount: 0, voicesCount: 0, instrumentalsCount: 0 };

      const [uCount] = await db.select({ count: sql`count(*)` }).from(users);
      const [sCount] = await db.select({ count: sql`count(*)` }).from(songs);
      const [vCount] = await db.select({ count: sql`count(*)` }).from(voiceClones);
      const [iCount] = await db.select({ count: sql`count(*)` }).from(instrumentals);

      return {
        usersCount: Number(uCount?.count || 0),
        songsCount: Number(sCount?.count || 0),
        voicesCount: Number(vCount?.count || 0),
        instrumentalsCount: Number(iCount?.count || 0),
      };
    }),

    usersList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Acceso denegado.");
      }
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(users).orderBy(desc(users.createdAt));
    }),
  }),
});

export type AppRouter = typeof appRouter;
