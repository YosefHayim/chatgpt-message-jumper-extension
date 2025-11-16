# Support

Thank you for using AI Conversation Navigator! This document provides guidance on getting help, reporting issues, and requesting features.

## Getting Help

### Documentation

Before reaching out, please check our comprehensive documentation:

- **[README.md](README.md)** - Overview, features, and installation
- **[QUICK_START.md](QUICK_START.md)** - Getting started guide
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development and building instructions
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[TESTING.md](TESTING.md)** - Testing guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture documentation

### Frequently Asked Questions

#### Installation Issues

**Q: The extension doesn't appear after installation**
- Ensure you've built the extension: `npm run build`
- Check that you loaded the correct directory (dist/)
- Verify Developer Mode is enabled in Chrome

**Q: Extension shows errors in console**
- Try rebuilding: `npm run clean && npm run build`
- Check that all dependencies are installed: `npm install`
- Verify you're using Node 18+

#### Usage Issues

**Q: Navigation button doesn't appear**
- Ensure you're on a supported platform (ChatGPT, Claude, or Gemini)
- Check that the extension is enabled in the popup
- Refresh the page after enabling

**Q: Message counting seems incorrect**
- The extension counts only AI assistant messages, not user messages
- Some platforms have different message structures that may affect counting
- Try refreshing the conversation

**Q: Token estimation seems off**
- Token estimation is approximate (~4 characters per token)
- Different platforms may tokenize differently
- This is a rough estimate, not exact token count

#### Feature Requests

**Q: Can you add support for [other platform]?**
- We're open to supporting more platforms! Please create an issue with details.

**Q: Can I customize keyboard shortcuts?**
- This feature is on the roadmap. Track progress in our issues.

## Reporting Bugs

Found a bug? We'd love to hear about it! Please help us by providing detailed information.

### Before Reporting

1. **Check existing issues**: Search [GitHub Issues](https://github.com/YosefHayim/ai-extension-conversation-navigator/issues) to see if it's already reported
2. **Verify it's reproducible**: Try to reproduce the bug in a clean environment
3. **Test on latest version**: Make sure you're using the latest version

### Bug Report Template

When reporting a bug, please include:

```markdown
**Description**
Clear description of what went wrong

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. Observe error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser: Chrome 120.0
- Extension Version: 2.0.0
- Platform: ChatGPT/Claude/Gemini
- OS: Windows 11/macOS 14/Ubuntu 22.04

**Screenshots**
If applicable, add screenshots

**Console Errors**
Any errors from browser console (F12)

**Additional Context**
Any other relevant information
```

### Where to Report

#### Option 1: GitHub Issues (Recommended)
Create an issue at: https://github.com/YosefHayim/ai-extension-conversation-navigator/issues

**Advantages:**
- Public discussion and tracking
- Community can help
- Searchable for others with same issue

#### Option 2: Email
Email: [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com?subject=AI%20Conversation%20Navigator%20-%20Bug%20Report)

**Use for:**
- Security vulnerabilities (do not post publicly!)
- Private concerns
- Detailed technical discussions

#### Option 3: LinkedIn
LinkedIn: [Yosef Hayim Sabag](https://www.linkedin.com/in/yosef-hayim-sabag/)

**Use for:**
- Professional networking
- General questions
- Collaboration opportunities

## Feature Requests

We welcome feature suggestions! Here's how to request features:

### Proposing Features

1. **Check existing requests**: Search [GitHub Issues](https://github.com/YosefHayim/ai-extension-conversation-navigator/issues) with label `enhancement`
2. **Be specific**: Clearly describe the feature and its benefits
3. **Explain use case**: Why is this feature needed?
4. **Consider implementation**: Is it feasible? Any technical constraints?

### Feature Request Template

```markdown
**Feature Title**
Short, descriptive title

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other approaches you've thought about

**Benefits**
Who benefits and how?

**Technical Considerations**
Any implementation thoughts?

**Additional Context**
Screenshots, mockups, or examples
```

### Where to Request

- **GitHub Issues**: https://github.com/YosefHayim/ai-extension-conversation-navigator/issues
- **Email**: [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com?subject=AI%20Conversation%20Navigator%20-%20Feature%20Request)
- **LinkedIn**: [Yosef Hayim Sabag](https://www.linkedin.com/in/yosef-hayim-sabag/)

## Getting Updates

### Stay Informed

- **Watch the repository**: Get notifications for new releases
- **Check release notes**: Read what's new in each version
- **Follow development**: See active development in pull requests

### Version Information

Current Version: **2.0.0**
Last Updated: **2025-01-16**

## Contributing

Want to help make AI Conversation Navigator better? We welcome contributions!

### Ways to Contribute

1. **Code Contributions**
   - Fix bugs
   - Implement features
   - Improve performance
   - Add tests
   - See [CONTRIBUTING.md](CONTRIBUTING.md)

2. **Documentation**
   - Improve existing docs
   - Add examples
   - Write tutorials
   - Translate documentation

3. **Testing**
   - Test new releases
   - Report bugs
   - Verify fixes
   - Test on different platforms

4. **Community Support**
   - Answer questions in issues
   - Help other users
   - Share your experience
   - Spread the word

### Getting Started with Contributions

See our [CONTRIBUTING.md](CONTRIBUTING.md) guide for detailed instructions on:
- Setting up development environment
- Coding standards
- Testing requirements
- Pull request process

## Contact Information

### Maintainer

**Yosef Hayim Sabag**

- **Email**: [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com)
- **LinkedIn**: [linkedin.com/in/yosef-hayim-sabag](https://www.linkedin.com/in/yosef-hayim-sabag/)
- **GitHub**: [@YosefHayim](https://github.com/YosefHayim)

### Response Time

- **Critical bugs**: Within 24-48 hours
- **General issues**: Within 3-5 business days
- **Feature requests**: Will be reviewed and prioritized
- **Pull requests**: Within 1 week

Please note these are target response times and may vary based on complexity and maintainer availability.

## Code of Conduct

This project follows a Code of Conduct. By participating, you agree to uphold this code. Please report unacceptable behavior to [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com).

See our full [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

### Reporting Security Vulnerabilities

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, email [yosefisabag@gmail.com](mailto:yosefisabag@gmail.com) with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We take security seriously and will respond promptly to verified reports.

### Security Best Practices

- Keep your extension updated
- Only install from trusted sources
- Review permissions requested
- Report suspicious behavior

## Resources

### External Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)

### Project Links

- **Repository**: https://github.com/YosefHayim/ai-extension-conversation-navigator
- **Issues**: https://github.com/YosefHayim/ai-extension-conversation-navigator/issues
- **Releases**: https://github.com/YosefHayim/ai-extension-conversation-navigator/releases

## Acknowledgments

Thank you to all contributors, users, and supporters of this project!

Special thanks to:
- The Chrome Extensions team for excellent documentation
- The TypeScript and Jest communities
- All users who report bugs and suggest features

---

## Quick Contact Reference

| Issue Type | Best Contact Method | Expected Response |
|------------|-------------------|-------------------|
| Bug Report | GitHub Issues | 24-48 hours |
| Feature Request | GitHub Issues | Reviewed weekly |
| Security Issue | Email (private) | 24 hours |
| General Question | GitHub Issues / Email | 3-5 days |
| Contributing Help | GitHub Issues / Email | 3-5 days |
| Professional Inquiry | LinkedIn | Variable |

---

**Need help right now?** Check the documentation first, then create a GitHub issue or send an email.

**Want to chat?** Connect on [LinkedIn](https://www.linkedin.com/in/yosef-hayim-sabag/)!

**Found this helpful?** Star the repository and share with others!

Thank you for using AI Conversation Navigator! 🚀
