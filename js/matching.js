/**
 * ResourceX – Rule-Based Resource Matching Service
 *
 * NOTE: For frontend demonstration, this module implements a transparent
 * rule-based matching simulation. It computes relevance based on keyword,
 * category, and exchange preference overlap.
 *
 * In production, this client-side module will be replaced with real
 * match rankings returned by the Java Spring Boot REST API.
 */

const MatchingEngine = (() => {

  /**
   * Evaluates a resource against a user requirement.
   * Returns { score: number, reasons: string[] }
   */
  function scoreMatch(resource, requirement) {
    let score = 0;
    const reasons = [];

    // 1. Category Match (30 pts)
    if (requirement.category && resource.category) {
      if (requirement.category.toLowerCase() === resource.category.toLowerCase()) {
        score += 30;
        reasons.push(`Exact category match: "${resource.category}"`);
      }
    }

    // 2. Resource Type Match (15 pts)
    if (!requirement.type || requirement.type === 'any' || requirement.type === resource.type) {
      score += 15;
      if (requirement.type && requirement.type !== 'any') {
        reasons.push(`Matched resource type: ${resource.type}`);
      }
    }

    // 3. Exchange Mode Match (15 pts)
    if (requirement.preferredModes && requirement.preferredModes.length > 0) {
      if (requirement.preferredModes.includes(resource.exchangeMode)) {
        score += 15;
        reasons.push(`Matches exchange preference: ${resource.exchangeMode}`);
      }
    } else {
      score += 10;
    }

    // 4. Budget Check (10 pts)
    if (requirement.budget !== undefined && requirement.budget !== null && requirement.budget !== '') {
      const budget = parseFloat(requirement.budget);
      if (resource.exchangeMode === 'free') {
        score += 10;
        reasons.push('Free resource within budget');
      } else if (resource.price <= budget) {
        score += 10;
        reasons.push(`Within budget: $${resource.price} <= $${budget}`);
      }
    } else {
      score += 10;
    }

    // 5. Keyword & Tag Overlap (up to 30 pts)
    const reqText = `${requirement.title || ''} ${requirement.description || ''} ${(requirement.tags || []).join(' ')}`.toLowerCase();
    const resText = `${resource.title || ''} ${resource.description || ''} ${(resource.tags || []).join(' ')} ${resource.department || ''}`.toLowerCase();

    // Extract search tokens (ignore small words)
    const stopWords = new Set(['the', 'and', 'for', 'with', 'need', 'project', 'course', 'this', 'that', 'from']);
    const tokens = (requirement.title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    if (requirement.tags) {
      requirement.tags.forEach(t => tokens.push(t.toLowerCase().trim()));
    }

    const matchedTokens = [];
    tokens.forEach(tok => {
      if (tok && resText.includes(tok) && !matchedTokens.includes(tok)) {
        matchedTokens.push(tok);
      }
    });

    if (matchedTokens.length > 0) {
      const tokenScore = Math.min(30, matchedTokens.length * 10);
      score += tokenScore;
      reasons.push(`Matching keywords: ${matchedTokens.slice(0, 4).join(', ')}`);
    }

    // Cap between 20% and 98% for realistic demonstration
    const finalPercentage = Math.min(98, Math.max(25, score));

    return {
      score: finalPercentage,
      reasons
    };
  }

  /**
   * Finds and ranks resources matching a given requirement.
   */
  async function findMatches(requirement, limit = 10) {
    const res = await API.resources.list({ pageSize: 50 });
    const allResources = res.items || DEMO_DATA.resources;

    const scored = allResources.map(r => {
      const { score, reasons } = scoreMatch(r, requirement);
      return {
        resource: r,
        matchPercentage: score,
        reasons
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return scored.slice(0, limit);
  }

  return {
    scoreMatch,
    findMatches
  };
})();
