import { NextResponse } from "next/server";
import { scoreRepo } from "@/lib/audit";

export const dynamic = "force-dynamic";

interface GithubRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  archived: boolean;
  pushed_at: string;
  default_branch: string;
  license: { spdx_id: string | null } | null;
}

interface GithubTree {
  tree?: { path: string }[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { repo?: unknown };
    const repo = typeof body.repo === "string" ? body.repo.trim() : "";

    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
      return NextResponse.json(
        { error: "Formato invalido. Usa owner/repo (por ejemplo belentani7/secure-t)." },
        { status: 400 },
      );
    }

    const [owner, name] = repo.split("/");
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "plasma-audit",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const base = "https://api.github.com";
    const metaRes = await fetch(`${base}/repos/${owner}/${name}`, { headers });

    if (metaRes.status === 404) {
      return NextResponse.json(
        { error: "Repositorio no encontrado o privado." },
        { status: 404 },
      );
    }
    if (metaRes.status === 403) {
      return NextResponse.json(
        { error: "Limite de la API de GitHub alcanzado. Intenta mas tarde." },
        { status: 429 },
      );
    }
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: "GitHub no respondio correctamente." },
        { status: 502 },
      );
    }

    const meta = (await metaRes.json()) as GithubRepo;
    const branch = meta.default_branch || "main";
    const treeRes = await fetch(
      `${base}/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
      { headers },
    );

    let paths: string[] = [];
    if (treeRes.ok) {
      const tree = (await treeRes.json()) as GithubTree;
      paths = (tree.tree ?? []).map((t) => t.path);
    }

    const result = scoreRepo(
      {
        fullName: meta.full_name,
        description: meta.description,
        stars: meta.stargazers_count,
        language: meta.language,
        archived: meta.archived,
        pushedAt: meta.pushed_at,
        license: meta.license?.spdx_id ?? null,
      },
      paths,
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error procesando la auditoria." },
      { status: 500 },
    );
  }
}
