const axios = require('axios');
const crypto = require('crypto');

class NexconnService {
  constructor() {
    this.appKey = process.env.NEXCONN_APP_KEY || 'z3v5yqkbzen70';
    this.appSecret = process.env.NEXCONN_APP_SECRET || 'Mdm1xfzVsWOnxe';
    this.primaryDomain = process.env.NEXCONN_PRIMARY_API_DOMAIN || 'https://api.sg-light-api.com';
    this.secondaryDomain = process.env.NEXCONN_SECONDARY_API_DOMAIN || 'https://api-b.sg-light-api.com';
  }

  generateHeaders() {
    const nonce = String(Math.floor(Math.random() * 1000000));
    const timestamp = String(Date.now());
    const signature = crypto
      .createHash('sha1')
      .update(this.appSecret + nonce + timestamp)
      .digest('hex');
    const requestId = crypto.randomUUID();

    return {
      'App-Key': this.appKey,
      'Nonce': nonce,
      'Timestamp': timestamp,
      'Signature': signature,
      'X-Request-ID': requestId,
      'Content-Type': 'application/json',
    };
  }

  async issueToken(userId, name, avatarUrl) {
    const payload = {
      userId: String(userId),
      name: name || `User_${userId}`,
      avatarUrl: avatarUrl || undefined,
    };

    const domains = [this.primaryDomain, this.secondaryDomain];
    let lastError = null;

    for (const domain of domains) {
      try {
        const response = await axios.post(`${domain}/v4/auth/access-token/issue`, payload, {
          headers: this.generateHeaders(),
          timeout: 7000,
        });

        if (response.data && response.data.code === 0 && response.data.result) {
          return {
            success: true,
            userId: response.data.result.userId,
            token: response.data.result.accessToken,
            appKey: this.appKey,
          };
        } else {
          throw new Error(response.data?.errorMessage || 'Token issue failed');
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Nexconn] Failed domain ${domain}:`, err.response?.data || err.message);
      }
    }

    throw new Error(`Failed to issue Nexconn token: ${lastError?.message}`);
  }
}

module.exports = new NexconnService();

