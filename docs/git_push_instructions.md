# Git Push Instructions

This repository uses the `work` branch for ongoing development. Follow the steps below to push your latest local commits to GitHub.

1. **Set the remote origin** (run once per environment):
   ```bash
   git remote add origin git@github.com:wllgs/test_kivalao.git
   ```
   If you prefer HTTPS, replace the URL with `https://github.com/wllgs/test_kivalao.git`.

2. **Verify remotes**:
   ```bash
   git remote -v
   ```

3. **Push the current branch**:
   ```bash
   git push -u origin work
   ```
   The `-u` flag sets `origin/work` as the upstream, so subsequent pushes can use `git push` without extra arguments.

4. **Troubleshooting authentication**:
   - For SSH, ensure your public key is registered in your GitHub account.
   - For HTTPS, GitHub requires a Personal Access Token (PAT) instead of your password.

5. **Confirm on GitHub**: Navigate to the repository page and check that the commits appear under the `work` branch.

These commands can be reused whenever you have new commits to share.
