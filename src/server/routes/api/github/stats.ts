import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const token = process.env['GITHUB_PAT'];
  
  if (!token) {
    return { 
      stars: 0,
      commits: 0,
      prs: 0,
      issues: 0,
      error: 'GITHUB_PAT not configured' 
    };
  }

  const username = 'aziz-zina';
  const headers = {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    const query = `
      query userInfo($login: String!) {
        user(login: $login) {
          name
          login
          contributionsCollection {
            totalCommitContributions
            restrictedContributionsCount
          }
          pullRequests(first: 1) {
            totalCount
          }
          issues(first: 1) {
            totalCount
          }
          repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
            totalCount
            nodes {
              stargazers {
                totalCount
              }
            }
          }
        }
      }
    `;

    const graphqlResponse = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    const graphqlData = await graphqlResponse.json();

    if (graphqlData.errors) {
       console.error('GraphQL Errors:', graphqlData.errors);
       return { error: 'Failed to fetch GraphQL data' };
    }

    const user = graphqlData.data?.user;
    
    // Calculate total stars
    const totalStars = user?.repositories?.nodes?.reduce((acc: number, repo: any) => {
      return acc + repo.stargazers.totalCount;
    }, 0) || 0;

    const totalPRs = user?.pullRequests?.totalCount || 0;
    const totalIssues = user?.issues?.totalCount || 0;
    let totalCommits = user?.contributionsCollection?.totalCommitContributions || 0;
    
    // Try to get all-time commits using the search API
    try {
      const searchResponse = await fetch(`https://api.github.com/search/commits?q=author:${username}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.cloak-preview'
        }
      });
      const searchData = await searchResponse.json();
      if (searchData.total_count) {
        totalCommits = searchData.total_count;
      }
    } catch (e) {
      console.error('Failed to fetch all-time commits, falling back to current year', e);
    }

    return {
      stars: totalStars,
      commits: totalCommits,
      prs: totalPRs,
      issues: totalIssues,
    };
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return { error: 'Internal Server Error' };
  }
});
