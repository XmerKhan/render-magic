# Render setup (one-time)

AutoCut Studio renders your video on a **GitHub Actions runner** instead of a
small always-on server. A free runner gets 4 CPUs and ~16 GB of RAM, which is
what a real Remotion render needs — the old 512 MB host simply ran out of memory
and died mid-export.

## How a render flows

```text
Browser                 App (Lovable Cloud)            GitHub Actions runner
   |  create job  ------------->  render_jobs row
   |  upload media (signed URLs) -> render-assets bucket
   |  dispatch  --------------->  workflow_dispatch  ------->  render.yml starts
   |                                                          claim job
   |                            <---- signed asset URLs ------
   |  poll status  ----------->  render_jobs  <-- progress ---  rendering
   |                            renders bucket  <-- MP4 upload
   |  download (signed URL) <---  status: done  <-- complete --
```

The runner never receives any project credentials. It authenticates with a
single-job access token and only ever gets short-lived signed URLs for that one
job's media and output file.

## What you need to do

1. **Push this project to a GitHub repository.** The repo must contain
   `.github/workflows/render.yml` and the `render-worker/` folder (both are
   already here).
2. **Create a GitHub personal access token** so the app can start the workflow:
   - Go to <https://github.com/settings/personal-access-tokens/new>
   - Repository access: **Only select repositories** → pick this repo
   - Permissions → Repository permissions → **Actions: Read and write**
   - Copy the token (it is only shown once)
3. **Save three values as secrets in this project:**

   | Secret | Value |
   | --- | --- |
   | `GITHUB_RENDER_TOKEN` | the token from step 2 |
   | `GITHUB_RENDER_REPO` | `your-username/your-repo` |
   | `RENDER_CALLBACK_URL` | your published app URL, e.g. `https://yourapp.lovable.app` |

   Optional: `GITHUB_RENDER_REF` (branch to run, default `main`) and
   `GITHUB_RENDER_WORKFLOW` (default `render.yml`).
4. **Publish the app.** The runner calls back to
   `RENDER_CALLBACK_URL/api/public/render-worker`, so that URL has to be
   reachable from the internet.

## Costs and limits

- GitHub Actions is free for public repos, and 2,000 minutes/month for private
  ones. A 60-second 1080p video typically takes 3-6 runner minutes.
- The workflow has a 60-minute timeout; a render that overruns it is reported
  back to the app as a failure rather than hanging the UI.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "The render farm is not configured yet" | `GITHUB_RENDER_TOKEN` / `GITHUB_RENDER_REPO` missing |
| "The render farm has no callback URL" | `RENDER_CALLBACK_URL` missing |
| GitHub returns 404 on dispatch | token lacks Actions write, wrong repo, or `render.yml` not on the target branch |
| GitHub returns 422 on dispatch | the workflow file exists but not on `GITHUB_RENDER_REF` |
| Job stays at "Render worker starting up" | check the run under the repo's **Actions** tab |
