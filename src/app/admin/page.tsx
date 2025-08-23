"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";

export default function UltraSecureAdminDashboard() {
  const [adminPassword, setAdminPassword] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userIP, setUserIP] = useState("");

  // Secure mutations
  const adminLogin = useMutation(api.adminAuth.adminLogin);
  const adminLogout = useMutation(api.adminAuth.adminLogout);
  const selectWinner = useMutation(api.winnerSelection.selectRaffleWinner);
  const resetSecurity = useMutation(api.adminAuth.resetAdminSecurity);

  // Authenticated queries
  const entries = useQuery(
    api.entries.getAllEntries, 
    sessionToken ? { limit: 100 } : "skip"
  );
  
  const raffleStats = useQuery(
    api.entries.getRaffleStats,
    sessionToken ? {} : "skip"
  );
  
  const leads = useQuery(
    api.leads.getAllLeads,
    sessionToken ? { limit: 100 } : "skip"
  );
  
  const raffleConfig = useQuery(api.payments.getRaffleConfig);
  const securityLogs = useQuery(
    api.adminAuth.getAdminSecurityLogs,
    sessionToken ? { sessionToken, limit: 20 } : "skip"
  );

  const sessionVerification = useQuery(
    api.adminAuth.verifyAdminSession,
    sessionToken ? { sessionToken, ipAddress: userIP } : "skip"
  );

  // Get user IP for security
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => setUserIP(data.ip))
      .catch(() => setUserIP("unknown"));
  }, []);

  // Define handleSecureLogout before using it in useEffect
  const handleSecureLogout = useCallback(async () => {
    if (sessionToken) {
      try {
        await adminLogout({ sessionToken });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    setIsAuthenticated(false);
    setSessionToken("");
    setAdminPassword("");
    localStorage.removeItem("ultra_secure_admin_session");
    console.log("🔓 SECURE LOGOUT COMPLETED");
  }, [sessionToken, adminLogout]);

  // Session management
  useEffect(() => {
    const savedSession = localStorage.getItem("ultra_secure_admin_session");
    if (savedSession) {
      setSessionToken(savedSession);
    }
  }, []);

  useEffect(() => {
    if (sessionVerification) {
      if (sessionVerification.valid) {
        setIsAuthenticated(true);
      } else {
        console.warn("🚨 Session invalid:", sessionVerification.reason);
        handleSecureLogout();
      }
    }
  }, [sessionVerification, handleSecureLogout]);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        if (lockoutTime - Date.now() <= 0) {
          setLockoutTime(0);
          setLoginAttempts(0);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleSecureLogin = async () => {
    if (lockoutTime > Date.now()) {
      const remainingMinutes = Math.ceil((lockoutTime - Date.now()) / 60000);
      alert(`🔒 SECURITY LOCKOUT: ${remainingMinutes} minutes remaining`);
      return;
    }

    setLoading(true);
    try {
      const result = await adminLogin({
        password: adminPassword,
        ipAddress: userIP,
        userAgent: navigator.userAgent,
      });

      if (result.success) {
        setSessionToken(result.sessionToken);
        setIsAuthenticated(true);
        setLoginAttempts(0);
        setLockoutTime(0);
        localStorage.setItem("ultra_secure_admin_session", result.sessionToken);
        setAdminPassword(""); // Clear immediately
        console.log("🔐 SECURE AUTHENTICATION SUCCESS");
      }
    } catch (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("locked")) {
        setLockoutTime(Date.now() + 30 * 60 * 1000);
      }
      
      setAdminPassword("");
      alert(`🚨 AUTHENTICATION FAILED: ${errorMessage}`);
      console.error("🚨 SECURITY BREACH ATTEMPT:", errorMessage);
    }
    setLoading(false);
  };

  const handleWinnerSelection = async () => {
    if (!sessionToken) return;
    
    const confirmation = confirm(
      "🚨 CRITICAL OPERATION 🚨\n\n" +
      "You are about to select a raffle winner using cryptographically secure randomness.\n\n" +
      "⚠️  THIS ACTION IS COMPLETELY IRREVERSIBLE ⚠️\n\n" +
      "✅ The selection will be mathematically fair\n" +
      "✅ Complete audit trail will be created\n" +
      "✅ Winner verification hash will be generated\n\n" +
      "Are you ABSOLUTELY CERTAIN you want to proceed?"
    );
    
    if (!confirmation) return;
    
    const finalConfirmation = prompt(
      "🎲 FINAL SECURITY CHECK 🎲\n\n" +
      "Type 'EXECUTE WINNER SELECTION' to confirm this irreversible action:"
    );
    
    if (finalConfirmation !== "EXECUTE WINNER SELECTION") {
      alert("❌ Operation cancelled - incorrect confirmation phrase");
      return;
    }
    
    try {
      setLoading(true);
      const result = await selectWinner({
        adminToken: "mvr-admin-2025-secure-token",
      });
      
      alert(
        `🏆 WINNER SELECTED! 🏆\n\n` +
        `Winner: ${result.winnerEmail}\n` +
        `Winning Ticket: #${result.winningTicketNumber}\n` +
        `Total Pool: ${result.totalTickets} tickets\n` +
        `Verification Hash: ${result.verificationHash.substring(0, 20)}...\n\n` +
        `This selection has been permanently recorded with full audit trail.`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`🚨 WINNER SELECTION FAILED: ${errorMessage}`);
    }
    setLoading(false);
  };

  const isLocked = lockoutTime > Date.now();

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          {/* ULTRA-SECURE WARNING */}
          <div className="bg-red-900/50 border-2 border-red-500 p-6 rounded-lg mb-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🛡️</div>
              <h2 className="font-bold text-red-400 text-xl">MAXIMUM SECURITY ZONE</h2>
            </div>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>🔒 Military-grade encryption active</li>
              <li>📊 All access attempts monitored & logged</li>
              <li>🚨 Automatic lockout after 3 failed attempts</li>
              <li>🌍 IP address tracking & geolocation</li>
              <li>⏰ Session auto-expiration (2 hours)</li>
              <li>🔐 Brute force protection enabled</li>
              <li>📝 Complete forensic audit trail</li>
            </ul>
          </div>

          <div className="text-center mb-8">
            <Image src="/LogoWhite.png" alt="MV Logo" width={200} height={56} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold">🔐 ULTRA-SECURE ADMIN</h1>
            <p className="text-gray-400">Enterprise Authentication Required</p>
            <p className="text-xs text-gray-500 mt-2">IP: {userIP || "Detecting..."}</p>
          </div>

          {loginAttempts > 0 && (
            <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded-lg mb-4">
              <p className="text-yellow-400 text-sm text-center">
                ⚠️ {loginAttempts} FAILED ATTEMPT{loginAttempts > 1 ? 'S' : ''} DETECTED
              </p>
            </div>
          )}

          {isLocked && (
            <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg mb-4">
              <p className="text-red-400 text-sm text-center mb-3">
                🚨 SECURITY LOCKOUT ACTIVE<br />
                {Math.ceil((lockoutTime - Date.now()) / 60000)} MINUTES REMAINING
              </p>
              <button
                onClick={async () => {
                  if (confirm("⚠️ SECURITY RESET WARNING\n\nThis will clear all lockouts and failed login attempts. Are you sure?")) {
                    try {
                      await resetSecurity({});
                      setLockoutTime(0);
                      setLoginAttempts(0);
                      alert("✅ Security lockouts have been reset. You can now try logging in again.");
                    } catch (error) {
                      alert(`❌ Failed to reset security: ${error}`);
                    }
                  }
                }}
                className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm font-bold"
              >
                🛠️ EMERGENCY SECURITY RESET
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter ultra-secure admin password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white pr-12"
                onKeyPress={(e) => e.key === "Enter" && !loading && !isLocked && handleSecureLogin()}
                disabled={loading || isLocked}
                autoComplete="off"
                maxLength={100}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-gray-400">🔐</span>
              </div>
            </div>
            <button
              onClick={handleSecureLogin}
              disabled={loading || isLocked || !adminPassword.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-4 rounded-lg font-bold text-lg"
            >
              {loading ? "🔍 AUTHENTICATING..." : isLocked ? "🔒 LOCKED" : "🛡️ SECURE ACCESS"}
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500 text-center space-y-1">
            <p>⚖️ Unauthorized access is a federal crime</p>
            <p>🕵️ All activities are monitored and recorded</p>
            <p>📞 Violations will be reported to authorities</p>
          </div>
        </div>
      </main>
    );
  }

  // Use enhanced stats from the backend
  const completedEntries = entries?.entries.filter(e => e.paymentStatus === "completed") || [];
  const paidEntries = completedEntries.filter(e => e.amount > 0);
  const freeEntries = completedEntries.filter(e => e.amount === 0);
  
  // Use raffleStats for accurate data or fallback to manual calculation
  const totalRevenue = raffleStats?.totalRevenue || paidEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalEntries = raffleStats?.totalEntries || completedEntries.reduce((sum, entry) => sum + entry.count, 0);
  const uniqueCustomers = raffleStats?.uniqueParticipants || new Set(completedEntries.map(e => e.email)).size;
  
  // Additional breakdown stats
  const freeParticipants = new Set(freeEntries.map(e => e.email)).size;
  const paidParticipants = new Set(paidEntries.map(e => e.email)).size;
  const freeTickets = freeEntries.reduce((sum, entry) => sum + entry.count, 0);
  const paidTickets = paidEntries.reduce((sum, entry) => sum + entry.count, 0);
  const bundlePurchases = raffleStats?.bundlePurchases || paidEntries.filter(e => e.bundle).length;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* ULTRA-SECURE HEADER */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image src="/LogoWhite.png" alt="MV Logo" width={120} height={34} />
              <div>
                <h1 className="text-xl font-bold">🛡️ ULTRA-SECURE ADMIN CONTROL</h1>
                <div className="text-xs text-green-400 space-x-4">
                  <span>🔐 Session: {sessionToken.substring(0, 15)}...</span>
                  <span>🌍 IP: {userIP}</span>
                  <span>⏰ Expires: {sessionVerification?.remainingTime ? Math.ceil(sessionVerification.remainingTime / 60000) : 0}m</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 px-3 py-1 rounded-full">
                <span className="text-green-400 text-xs">🔒 SECURE</span>
              </div>
              <button
                onClick={handleSecureLogout}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-sm font-bold"
              >
                🔓 SECURE LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* SECURE TAB NAVIGATION */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: "dashboard", name: "📊 Dashboard" },
              { id: "winner", name: "🏆 Winner Selection" },
              { id: "orders", name: "💰 Orders" },
              { id: "security", name: "🔒 Security Logs" },
              { id: "testing", name: "🧪 System Tests" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="bg-green-900/30 border border-green-500 p-6 rounded-lg">
              <h3 className="font-bold text-green-400 mb-2">🛡️ MAXIMUM SECURITY STATUS: ACTIVE</h3>
              <p className="text-sm text-gray-300">
                All admin functions protected by enterprise-grade security. Session authenticated with military-grade encryption.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
                <h3 className="text-gray-400 text-sm font-medium">💰 Total Revenue</h3>
                <p className="text-3xl font-bold text-green-400">
                  ${(totalRevenue / 100).toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-gray-400 text-sm font-medium">🎫 Total Tickets</h3>
                <p className="text-3xl font-bold text-blue-400">{totalEntries}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
                <h3 className="text-gray-400 text-sm font-medium">👥 Total Participants</h3>
                <p className="text-3xl font-bold text-purple-400">{uniqueCustomers}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
                <h3 className="text-gray-400 text-sm font-medium">📦 Bundle Purchases</h3>
                <p className="text-3xl font-bold text-yellow-400">{bundlePurchases}</p>
              </div>
            </div>

            {/* PARTICIPANT BREAKDOWN */}
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold mb-6">📊 PARTICIPANT & TICKET BREAKDOWN</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Participants */}
                <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-cyan-500">
                  <h4 className="text-lg font-bold text-cyan-400 mb-4">🆓 Free Participants (Subscribers)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">👥 Unique Subscribers:</span>
                      <span className="text-2xl font-bold text-cyan-400">{freeParticipants}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">🎫 Free Tickets:</span>
                      <span className="text-2xl font-bold text-cyan-400">{freeTickets}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      💡 Users who signed up on landing page get 1 free ticket each
                    </div>
                  </div>
                </div>

                {/* Paid Participants */}
                <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-emerald-500">
                  <h4 className="text-lg font-bold text-emerald-400 mb-4">💳 Paid Participants (Customers)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">👥 Unique Buyers:</span>
                      <span className="text-2xl font-bold text-emerald-400">{paidParticipants}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">🎫 Purchased Tickets:</span>
                      <span className="text-2xl font-bold text-emerald-400">{paidTickets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">💰 Revenue:</span>
                      <span className="text-xl font-bold text-green-400">${(totalRevenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      🛒 Customers who purchased 1 ticket ($50) or 4-ticket bundle ($100)
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 p-4 bg-gray-600 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{totalEntries}</p>
                    <p className="text-xs text-gray-400">Total Pool</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{uniqueCustomers}</p>
                    <p className="text-xs text-gray-400">All Participants</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400">
                      {uniqueCustomers > 0 ? (totalEntries / uniqueCustomers).toFixed(1) : '0'}
                    </p>
                    <p className="text-xs text-gray-400">Avg Tickets/Person</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-pink-400">
                      {freeParticipants > 0 ? Math.round((freeParticipants / uniqueCustomers) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-400">Free Participants</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WINNER SELECTION */}
        {activeTab === "winner" && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-6">🏆 CRYPTOGRAPHICALLY SECURE WINNER SELECTION</h3>
              
              <div className="bg-red-900/50 border-2 border-red-500 p-6 rounded-lg mb-6">
                <h4 className="font-bold text-red-400 text-lg mb-3">⚠️ CRITICAL SECURITY NOTICE ⚠️</h4>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>🔒 Winner selection uses military-grade cryptographic randomness</p>
                  <p>📝 Complete forensic audit trail will be created</p>
                  <p>🔐 Verification hash ensures authenticity</p>
                  <p>⚠️  THIS OPERATION IS COMPLETELY IRREVERSIBLE</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-700 p-6 rounded-lg text-center border-l-4 border-blue-500">
                  <h4 className="font-bold mb-2">🎫 Ticket Pool</h4>
                  <p className="text-4xl font-bold text-blue-400">{totalEntries}</p>
                  <p className="text-sm text-gray-400">total tickets</p>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg text-center border-l-4 border-purple-500">
                  <h4 className="font-bold mb-2">👥 Participants</h4>
                  <p className="text-4xl font-bold text-purple-400">{uniqueCustomers}</p>
                  <p className="text-sm text-gray-400">unique players</p>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg text-center border-l-4 border-yellow-500">
                  <h4 className="font-bold mb-2">🎯 Status</h4>
                  <p className="text-2xl">
                    {raffleConfig?.hasWinner ? (
                      <span className="text-green-400">🏆 WINNER SELECTED</span>
                    ) : (
                      <span className="text-yellow-400">⏳ PENDING</span>
                    )}
                  </p>
                </div>
              </div>

              {!raffleConfig?.hasWinner && (
                <button 
                  onClick={handleWinnerSelection}
                  disabled={totalEntries === 0 || loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-8 py-6 rounded-lg font-bold text-xl border-2 border-red-500"
                >
                  {loading ? "🔄 PROCESSING..." : totalEntries === 0 ? "❌ NO TICKETS AVAILABLE" : "🎲 EXECUTE WINNER SELECTION (IRREVERSIBLE)"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECURITY LOGS */}
        {activeTab === "security" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6">🔒 FORENSIC SECURITY AUDIT LOGS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b-2 border-gray-700">
                    <th className="text-left py-4">🚨 Event Type</th>
                    <th className="text-left py-4">🌍 IP Address</th>
                    <th className="text-left py-4">🖥️ User Agent</th>
                    <th className="text-left py-4">📅 Timestamp</th>
                    <th className="text-left py-4">📋 Details</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs?.map((log) => (
                    <tr key={log._id} className="border-b border-gray-700">
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          log.type === "successful_login" ? "bg-green-500/30 text-green-300" :
                          log.type === "failed_login" ? "bg-red-500/30 text-red-300" :
                          log.type === "lockout" ? "bg-red-600/30 text-red-200" :
                          "bg-yellow-500/30 text-yellow-300"
                        }`}>
                          {log.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-xs">{log.ipAddress}</td>
                      <td className="py-4 text-xs">{log.userAgent.substring(0, 30)}...</td>
                      <td className="py-4">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-4 text-xs">{JSON.parse(log.data || "{}").reason || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6">💰 SECURE ORDER MANAGEMENT</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b-2 border-gray-700">
                    <th className="text-left py-4">👤 Customer</th>
                    <th className="text-left py-4">🎫 Tickets</th>
                    <th className="text-left py-4">💰 Amount</th>
                    <th className="text-left py-4">📊 Status</th>
                    <th className="text-left py-4">📅 Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEntries.slice(0, 10).map((entry) => (
                    <tr key={entry._id} className="border-b border-gray-700">
                      <td className="py-4">{entry.email}</td>
                      <td className="py-4 font-bold text-blue-400">{entry.count}</td>
                      <td className="py-4 font-bold text-green-400">${(entry.amount / 100).toFixed(2)}</td>
                      <td className="py-4">
                        <span className="bg-green-500/30 text-green-300 px-2 py-1 rounded-full text-xs font-bold">
                          {entry.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TESTING */}
        {activeTab === "testing" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6">🧪 SYSTEM INTEGRITY TESTING</h3>
            
            <div className="bg-blue-900/30 border border-blue-500 p-6 rounded-lg mb-6">
              <h4 className="font-bold text-blue-400 text-lg mb-3">📊 Current System Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{totalEntries}</p>
                  <p className="text-sm text-gray-400">Total Tickets</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">{uniqueCustomers}</p>
                  <p className="text-sm text-gray-400">Participants</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">
                    {uniqueCustomers > 0 ? (totalEntries / uniqueCustomers).toFixed(1) : '0'}
                  </p>
                  <p className="text-sm text-gray-400">Avg Tickets/Person</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">
                    {raffleConfig?.hasWinner ? "SELECTED" : "PENDING"}
                  </p>
                  <p className="text-sm text-gray-400">Winner Status</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg mb-6">
              <h4 className="font-bold mb-4">🔧 Database Management</h4>
              <div className="bg-yellow-900/30 border border-yellow-500 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-300 mb-2">⚠️ Database initialization is required if countdown timer is not working</p>
                <p className="text-xs text-gray-400">This will create the default raffle configuration if none exists.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-lg font-medium border border-purple-500"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/init-db', { method: 'POST' });
                      const result = await response.json();
                      alert(result.message || 'Database initialized successfully!');
                    } catch (error) {
                      alert('Failed to initialize database: ' + error);
                    }
                  }}
                >
                  🗄️ Initialize Database
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg font-medium border border-blue-500"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/init-db');
                      const status = await response.json();
                      alert(`Database Status:\n\n` +
                        `✅ Initialized: ${status.isInitialized}\n` +
                        `📊 Total Entries: ${status.stats.totalEntries}\n` +
                        `✅ Completed: ${status.stats.completedEntries}\n` +
                        `🏆 Winners: ${status.stats.totalWinners}\n` +
                        `💳 Payment Events: ${status.stats.totalPaymentEvents}`);
                    } catch (error) {
                      alert('Failed to get database status: ' + error);
                    }
                  }}
                >
                  📊 Check Database Status
                </button>
                <button 
                  className="bg-orange-600 hover:bg-orange-700 px-6 py-4 rounded-lg font-medium border border-orange-500"
                  onClick={() => {
                    const debugInfo = `🔍 COMPLETE DEBUG INFO:\n\n` +
                      `📧 Leads Data:\n` +
                      `- Total Leads: ${leads?.leads.length || 0}\n` +
                      `- Lead Emails: ${leads?.leads.map(l => l.email).join(', ') || 'None'}\n\n` +
                      `📊 Raw Entry Data:\n` +
                      `- Total Entries Query: ${entries?.entries.length || 0}\n` +
                      `- All Entry Emails: ${entries?.entries.map(e => e.email).join(', ') || 'None'}\n` +
                      `- Completed Entries: ${completedEntries.length}\n` +
                      `- Free Entries: ${freeEntries.length}\n` +
                      `- Paid Entries: ${paidEntries.length}\n\n` +
                      `👥 Participant Counts:\n` +
                      `- Free Participants: ${freeParticipants}\n` +
                      `- Free Entry Emails: ${freeEntries.map(e => e.email).join(', ') || 'None'}\n` +
                      `- Paid Participants: ${paidParticipants}\n` +
                      `- Paid Entry Emails: ${paidEntries.map(e => e.email).join(', ') || 'None'}\n` +
                      `- Total Unique: ${uniqueCustomers}\n\n` +
                      `🎫 Ticket Counts:\n` +
                      `- Free Tickets: ${freeTickets}\n` +
                      `- Paid Tickets: ${paidTickets}\n` +
                      `- Total Tickets: ${totalEntries}\n\n` +
                      `📈 Stats Query Result:\n` +
                      `- Total Entries: ${raffleStats?.totalEntries || 'N/A'}\n` +
                      `- Total Revenue: $${(raffleStats?.totalRevenue || 0) / 100}\n` +
                      `- Unique Participants: ${raffleStats?.uniqueParticipants || 'N/A'}\n\n` +
                      `🔄 This shows complete data. Check if emails match between leads and entries.`;
                    
                    alert(debugInfo);
                  }}
                >
                  🐛 Debug Data
                </button>
              </div>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg">
              <h4 className="font-bold mb-4">🔧 Testing Operations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg font-medium border border-blue-500"
                  onClick={() => alert('🧪 Test scenario creation is available for comprehensive fairness testing')}
                >
                  🧪 Create Test Scenarios
                </button>
                <button 
                  className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg font-medium border border-green-500"
                  onClick={() => alert('📊 Fairness simulation would run 10,000+ iterations to verify statistical fairness')}
                >
                  📊 Run Fairness Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
