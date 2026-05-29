"""Pre-Docker build checklist for NLP service."""
import os

print("=" * 60)
print("  PRE-DOCKER BUILD CHECK — NLP Service")
print("=" * 60)

# ── 1. Check __init__.py ──────────────────────────────────────
print("\n[1] __init__.py FILES")
dirs = [
    "nlp",
    "nlp/api",
    "nlp/embeddings",
    "nlp/retrieval",
    "nlp/prompting",
    "nlp/configs",
    "nlp/tests",
]
missing_init = []
for d in dirs:
    path = os.path.join(d, "__init__.py")
    exists = os.path.exists(path)
    status = "OK" if exists else "MISSING"
    print(f"  {path:35s} {status}")
    if not exists:
        missing_init.append(path)

# ── 2. Check .env file ───────────────────────────────────────
print("\n[2] .ENV FILE")
env_path = ".env"
if os.path.exists(env_path):
    print(f"  {env_path}: OK")
    with open(env_path, "r") as f:
        lines = f.readlines()
    required_keys = ["NVIDIA_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "REDIS_URL"]
    for key in required_keys:
        found = any(line.strip().startswith(key + "=") for line in lines)
        status = "SET" if found else "NOT FOUND"
        print(f"    {key:25s} {status}")
else:
    print(f"  {env_path}: MISSING!")

# ── 3. Check requirements.txt duplicates ─────────────────────
print("\n[3] REQUIREMENTS.TXT AUDIT")
req_path = "nlp/requirements.txt"
docker_preinstalled = ["torch", "sentence-transformers", "transformers"]
eval_only = ["ragas", "datasets", "langchain-groq", "langchain-openai"]
needed_missing = ["redis"]

with open(req_path, "r") as f:
    req_lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]

pkg_names = []
for line in req_lines:
    name = line.split("==")[0].split(">=")[0].split("<=")[0].split("<")[0].split(">")[0].strip()
    pkg_names.append(name.lower())

print("  Duplicates (already in Dockerfile Layer 2-3):")
for pkg in docker_preinstalled:
    if pkg.lower() in pkg_names:
        print(f"    {pkg:30s} DUPLICATE (can remove from requirements.txt)")
    else:
        print(f"    {pkg:30s} not in requirements.txt (OK)")

print("  Eval-only packages (not needed in production image):")
for pkg in eval_only:
    if pkg.lower() in pkg_names:
        print(f"    {pkg:30s} FOUND (consider removing for prod)")
    else:
        print(f"    {pkg:30s} not present (OK)")

print("  Missing packages needed for production:")
for pkg in needed_missing:
    if pkg.lower() in pkg_names:
        print(f"    {pkg:30s} already present (OK)")
    else:
        print(f"    {pkg:30s} MISSING — needs to be added")

# ── 4. Check entrypoint ──────────────────────────────────────
print("\n[4] ENTRYPOINT CHECK")
main_path = "nlp/api/main.py"
if os.path.exists(main_path):
    print(f"  {main_path}: OK")
    with open(main_path, "r") as f:
        content = f.read()
    if "app" in content:
        print(f"    FastAPI 'app' object: FOUND")
    else:
        print(f"    FastAPI 'app' object: NOT FOUND — uvicorn will fail!")
else:
    print(f"  {main_path}: MISSING — cannot start service!")

# ── 5. Check Dockerfile exists ────────────────────────────────
print("\n[5] DOCKER FILES")
docker_files = [
    "nlp/Dockerfile.nlp",
    ".dockerignore",
    "docker-compose.yml",
]
for f in docker_files:
    status = "OK" if os.path.exists(f) else "MISSING"
    print(f"  {f:40s} {status}")

# ── Summary ──────────────────────────────────────────────────
print("\n" + "=" * 60)
issues = []
if missing_init:
    issues.append(f"Missing __init__.py: {', '.join(missing_init)}")
if not os.path.exists(env_path):
    issues.append("Missing .env file")
if "redis" not in pkg_names:
    issues.append("Package 'redis' missing from requirements.txt")

if issues:
    print(f"  ISSUES FOUND: {len(issues)}")
    for i, issue in enumerate(issues, 1):
        print(f"    {i}. {issue}")
else:
    print("  ALL CHECKS PASSED!")
print("=" * 60)
