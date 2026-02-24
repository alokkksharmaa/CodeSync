async function test() {
  try {
    const ts = Date.now();
    // 1. Signup
    const signupRes = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${ts}`,
        email: `testuser_${ts}@example.com`,
        password: 'password123'
      })
    });
    
    if (!signupRes.ok) throw new Error('Signup failed ' + await signupRes.text());
    const signupData = await signupRes.json();
    const token = signupData.token;
    
    // 2. Create WS
    const wsRes = await fetch('http://localhost:3001/api/workspaces', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: `WS ${ts}`,
        language: 'javascript'
      })
    });
    
    if (!wsRes.ok) throw new Error('WS failed ' + await wsRes.text());
    const wsData = await wsRes.json();
    const workspaceId = wsData.workspace._id;
    
    // 2.5 Fetch Workplace
    const getWsRes = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getWsData = await getWsRes.json();
    console.log('EXISTING FILES:', getWsData.files);

    // 3. Create File
    const fileRes = await fetch('http://localhost:3001/api/files', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        workspaceId,
        name: 'testFile.js',
        path: '/',
        type: 'file'
      })
    });
    
    const fileData = await fileRes.json();
    console.log('FILE STATUS:', fileRes.status, fileData);
    
  } catch (err) {
    console.error('TEST ERR', err);
  }
}
test();
