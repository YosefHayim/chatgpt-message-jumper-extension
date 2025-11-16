# CI/CD Documentation

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`, `develop`, or feature branches (`claude/**`, `feature/**`, `fix/**`)

**Jobs:**

#### Test & Coverage
- Runs on Node.js 18.x and 20.x
- Executes all tests with coverage
- Enforces coverage thresholds:
  - **Statements: 90%**
  - **Functions: 90%**
  - **Lines: 90%**
  - **Branches: 80%** (warning only)
- Uploads coverage to Codecov
- Comments PR with coverage report

#### Build
- Runs after tests pass
- Builds the extension
- Verifies all required files exist
- Uploads build artifact (7-day retention)

#### Build Release Packages
- Only runs on `main` branch or tags
- Creates Chrome/Edge ZIP package
- Creates Firefox ZIP package
- Uploads packages (30-day retention)

#### Auto-merge
- Automatically merges PRs with `auto-merge` label
- Only if tests and build pass
- Uses squash merge

### 2. Release Workflow (`release.yml`)

**Triggers:**
- Push of version tags (e.g., `v2.0.0`)

**Jobs:**

#### Create Release
- Runs all tests
- Builds Chrome/Edge and Firefox packages
- Generates changelog from commits
- Creates GitHub Release with:
  - Chrome/Edge ZIP
  - Firefox ZIP
  - Release notes
  - Full changelog

#### Publish Notification
- Provides next steps for manual store uploads
- Links to publishing guide

**Creating a Release:**

```bash
# 1. Update version in package.json and manifest.json
npm version patch  # or minor, or major

# 2. Create and push tag
git tag v2.0.1
git push origin v2.0.1

# 3. GitHub Actions will automatically:
#    - Run tests
#    - Build packages
#    - Create GitHub release
```

### 3. Scheduled Tests (`scheduled-tests.yml`)

**Triggers:**
- Daily at 00:00 UTC (cron)
- Manual dispatch

**Jobs:**

#### Daily Tests
- Runs tests on Node.js 18.x, 20.x, and 21.x
- Uploads coverage to Codecov

#### Security Audit
- Runs `npm audit`
- Checks for moderate+ severity vulnerabilities

#### Dependency Check
- Lists outdated dependencies

#### Notify on Failure
- Creates GitHub issue if tests fail

### 4. Dependabot (`dependabot.yml`)

**Configuration:**

- **npm dependencies:**
  - Weekly updates on Mondays at 09:00 UTC
  - Max 10 open PRs
  - Ignores major version updates
  - Auto-assigns to maintainer

- **GitHub Actions:**
  - Weekly updates on Mondays at 09:00 UTC
  - Max 5 open PRs
  - Auto-assigns to maintainer

## Coverage Requirements

### Global Thresholds (jest.config.js)

```javascript
global: {
  branches: 80,    // 80% branch coverage
  functions: 90,   // 90% function coverage
  lines: 90,       // 90% line coverage
  statements: 90   // 90% statement coverage
}
```

### Service Layer (Higher Requirements)

```javascript
'./src/services/**/*.ts': {
  branches: 85,    // 85% branch coverage
  functions: 95,   // 95% function coverage
  lines: 95,       // 95% line coverage
  statements: 95   // 95% statement coverage
}
```

## Local Testing

Before pushing, ensure your changes pass CI:

```bash
# Run tests with coverage
npm run test:coverage

# Build extension
npm run build

# Build release packages
npm run build:all
```

## Branch Protection Rules

Recommended settings for `main` branch:

- [x] Require status checks to pass before merging
  - [x] Test & Coverage
  - [x] Build Extension
- [x] Require branches to be up to date before merging
- [x] Require pull request reviews (1 reviewer)
- [x] Dismiss stale pull request approvals
- [x] Require linear history
- [x] Include administrators

## Secrets Configuration

Required secrets in repository settings:

| Secret | Purpose | Required |
|--------|---------|----------|
| `CODECOV_TOKEN` | Upload coverage to Codecov | Optional |
| `GITHUB_TOKEN` | Automatically provided by GitHub | Auto |

## Status Badges

Add these to your README:

```markdown
![CI](https://github.com/YosefHayim/ai-extension-navigator/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/YosefHayim/ai-extension-navigator/branch/main/graph/badge.svg)
```

## Troubleshooting

### Tests Failing in CI but Pass Locally

1. Check Node.js version matches CI (18.x or 20.x)
2. Clear npm cache: `npm ci` (instead of `npm install`)
3. Check for environment-specific code

### Coverage Below Threshold

1. Run `npm run test:coverage` locally
2. Check `coverage/lcov-report/index.html` for details
3. Add tests for uncovered lines
4. Service layer needs 95%+ coverage

### Build Failures

1. Ensure `npm run build` works locally
2. Check all required files in `dist/`
3. Verify manifest.json is valid
4. Check esbuild errors in CI logs

### Auto-merge Not Working

1. Ensure PR has `auto-merge` label
2. Check all required checks pass
3. Verify `GITHUB_TOKEN` permissions
4. Check branch protection rules

## Workflow Permissions

All workflows use default `GITHUB_TOKEN` with permissions:

- **Read:** All repository content
- **Write:** Actions, checks, pull requests, issues
- **Admin:** None (requires manual configuration)

## Performance

Typical workflow times:

- **CI Pipeline:** 3-5 minutes
- **Release:** 4-6 minutes
- **Scheduled Tests:** 5-8 minutes

## Cost Optimization

GitHub Actions is free for public repositories. For private:

- ~2000 minutes/month on Free plan
- Each workflow run: ~3-5 minutes
- Estimated usage: ~450 minutes/month (90 runs)
- Well within free tier limits

## Maintenance

### Monthly Tasks

- [ ] Review Dependabot PRs
- [ ] Check Codecov trends
- [ ] Review failed scheduled tests
- [ ] Update Node.js versions in matrix

### Quarterly Tasks

- [ ] Update GitHub Actions versions
- [ ] Review and update coverage thresholds
- [ ] Audit workflow performance
- [ ] Clean up old artifacts

## Support

For CI/CD issues:
- Check [Actions tab](../../actions) for logs
- Review workflow files in `.github/workflows/`
- See [GitHub Actions docs](https://docs.github.com/en/actions)

---

**Last Updated:** 2025-11-16
