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
  
  // Winner data
  const winnersData = useQuery(
    api.winnerSelection.getAllCurrentWinners,
    sessionToken && isAuthenticated ? {} : "skip"
  );

  // Authenticated queries
  const entries = useQuery(
    api.entries.getAllEntries, 
    sessionToken ? { limit: 100 } : "skip"
  );
  
  const raffleStats = useQuery(
    api.entries.getRaffleStats,
    sessionToken ? {} : "skip"
  );
  
  
  const raffleConfig = useQuery(api.payments.getRaffleConfig);
  const securityLogs = useQuery(
    api.adminAuth.getAdminSecurityLogs,
    sessionToken && isAuthenticated ? { sessionToken, limit: 20 } : "skip"
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
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-sm w-full p-6">
          <div className="text-center mb-8">
            <Image src="/shopPageLogo.png" alt="Most Valuable" width={200} height={67} className="mx-auto mb-6" />
            <h1 className="text-xl font-medium text-black">Admin Access</h1>
          </div>

          {loginAttempts > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
              <p className="text-red-600 text-sm text-center">
                {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {isLocked && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <p className="text-red-600 text-sm text-center mb-3">
                Too many attempts. Try again in {Math.ceil((lockoutTime - Date.now()) / 60000)} minutes.
              </p>
              <button
                onClick={async () => {
                  if (confirm("Reset login attempts?")) {
                    try {
                      await resetSecurity({});
                      setLockoutTime(0);
                      setLoginAttempts(0);
                    } catch (error) {
                      alert(`Reset failed: ${error}`);
                    }
                  }
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                Reset
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && !loading && !isLocked && handleSecureLogin()}
              disabled={loading || isLocked}
              autoComplete="off"
            />
            <button
              onClick={handleSecureLogin}
              disabled={loading || isLocked || !adminPassword.trim()}
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium"
            >
              {loading ? "Signing in..." : isLocked ? "Locked" : "Sign In"}
            </button>
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
    <main className="min-h-screen bg-white">
      {/* Clean Admin Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image src="/shopPageLogo.png" alt="Most Valuable" width={120} height={40} />
              <h1 className="text-xl font-medium text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleSecureLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Clean Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: "dashboard", name: "Dashboard" },
              { id: "winner", name: "Winner Selection" },
              { id: "orders", name: "Orders" },
              { id: "security", name: "Security Logs" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${(totalRevenue / 100).toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-600 text-sm font-medium">Total Tickets</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalEntries}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-600 text-sm font-medium">Total Participants</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueCustomers}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-600 text-sm font-medium">Bundle Purchases</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{bundlePurchases}</p>
              </div>
            </div>

            {/* Participant Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Participant Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Participants */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Free Participants (Subscribers)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Unique Subscribers:</span>
                      <span className="font-semibold text-gray-900">{freeParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Free Tickets:</span>
                      <span className="font-semibold text-gray-900">{freeTickets}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Users who signed up on landing page get 1 free ticket each
                    </div>
                  </div>
                </div>

                {/* Paid Participants */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Paid Participants (Customers)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Unique Buyers:</span>
                      <span className="font-semibold text-gray-900">{paidParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Purchased Tickets:</span>
                      <span className="font-semibold text-gray-900">{paidTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Revenue:</span>
                      <span className="font-semibold text-gray-900">${(totalRevenue / 100).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Customers who purchased 1 ticket ($50) or 4-ticket bundle ($100)
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{totalEntries}</p>
                    <p className="text-xs text-gray-500">Total Pool</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{uniqueCustomers}</p>
                    <p className="text-xs text-gray-500">All Participants</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {uniqueCustomers > 0 ? (totalEntries / uniqueCustomers).toFixed(1) : '0'}
                    </p>
                    <p className="text-xs text-gray-500">Avg Tickets/Person</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {freeParticipants > 0 ? Math.round((freeParticipants / uniqueCustomers) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">Free Participants</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WINNER SELECTION */}
        {activeTab === "winner" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Winner Selection</h3>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-amber-800 mb-2">Important Notice</h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Winner selection uses secure randomness</p>
                  <p>• Complete audit trail will be created</p>
                  <p>• Verification hash ensures authenticity</p>
                  <p>• This operation is irreversible</p>
                  <p>• This raffle supports 1 winner</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ticket Pool</h4>
                  <p className="text-3xl font-bold text-gray-900">{totalEntries}</p>
                  <p className="text-sm text-gray-500">total tickets</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Participants</h4>
                  <p className="text-3xl font-bold text-gray-900">{uniqueCustomers}</p>
                  <p className="text-sm text-gray-500">unique players</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Winners Selected</h4>
                  <p className="text-3xl font-bold text-gray-900">{winnersData?.winners.length || 0}</p>
                  <p className="text-sm text-gray-500">of {raffleConfig?.maxWinners || 1}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                  <p className="text-lg font-medium">
                    {winnersData && winnersData.winners.length >= (raffleConfig?.maxWinners || 1) ? (
                      <span className="text-green-600">Complete</span>
                    ) : winnersData && winnersData.winners.length > 0 ? (
                      <span className="text-blue-600">Partial</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Current Winners Display */}
              {winnersData && winnersData.winners.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-green-800 mb-4">🏆 Selected Winners</h4>
                  <div className="space-y-4">
                    {winnersData.winners.map((winner, index) => (
                      <div key={winner._id} className="bg-white border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">Winner #{index + 1}</h5>
                            <p className="text-sm text-gray-600">{winner.winnerEmail}</p>
                            <p className="text-xs text-gray-500">Ticket #{winner.winningTicketNumber}</p>
                            <p className="text-xs text-gray-500 font-mono">
                              Hash: {winner.verificationHash.substring(0, 16)}...
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>Selected: {new Date(winner.selectedAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Winner Selection Button */}
              {winnersData && winnersData.remainingWinners > 0 ? (
                <button 
                  onClick={handleWinnerSelection}
                  disabled={totalEntries === 0 || loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {loading ? "Processing..." : totalEntries === 0 ? "No Tickets Available" : "Select Winner"}
                </button>
              ) : winnersData && winnersData.remainingWinners === 0 ? (
                <div className="text-center py-4">
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <span className="text-lg mr-2">🎉</span>
                    Winner has been selected!
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleWinnerSelection}
                  disabled={totalEntries === 0 || loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
                >
                  {loading ? "Processing..." : totalEntries === 0 ? "No Tickets Available" : "Select Winner"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECURITY LOGS */}
        {activeTab === "security" && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b-2 border-gray-200">
                    <th className="text-left py-4 font-medium">Event Type</th>
                    <th className="text-left py-4 font-medium">IP Address</th>
                    <th className="text-left py-4 font-medium">User Agent</th>
                    <th className="text-left py-4 font-medium">Timestamp</th>
                    <th className="text-left py-4 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs?.map((log) => (
                    <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          log.type === "successful_login" ? "bg-green-100 text-green-800" :
                          log.type === "failed_login" ? "bg-red-100 text-red-800" :
                          log.type === "lockout" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {log.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-xs text-gray-600">{log.ipAddress}</td>
                      <td className="py-4 text-xs text-gray-600">{log.userAgent.substring(0, 40)}...</td>
                      <td className="py-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-4 text-xs text-gray-500">{JSON.parse(log.data || "{}").reason || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!securityLogs || securityLogs.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No security logs available.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {activeTab === "orders" && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Management</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b-2 border-gray-200">
                    <th className="text-left py-4 font-medium">Customer</th>
                    <th className="text-left py-4 font-medium">Product Details</th>
                    <th className="text-left py-4 font-medium">Entries</th>
                    <th className="text-left py-4 font-medium">Amount</th>
                    <th className="text-left py-4 font-medium">Status</th>
                    <th className="text-left py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEntries.slice(0, 20).map((entry) => (
                    <tr key={entry._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-gray-900">{entry.email}</div>
                          {entry.phone && (
                            <div className="text-xs text-gray-500">{entry.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          {entry.productName ? (
                            <div className="font-medium text-gray-900">{entry.productName}</div>
                          ) : (
                            <div className="font-medium text-gray-900">Holiday Collection</div>
                          )}
                          <div className="flex gap-3 text-xs text-gray-600">
                            {entry.variantColor && (
                              <span className="bg-gray-100 px-2 py-1 rounded">Color: {entry.variantColor}</span>
                            )}
                            {entry.size && (
                              <span className="bg-gray-100 px-2 py-1 rounded">Size: {entry.size}</span>
                            )}
                          </div>
                          {entry.bundle && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Bundle Deal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold text-gray-900">{entry.count}</span>
                        <span className="text-xs text-gray-500 ml-1">tickets</span>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold text-gray-900">${(entry.amount / 100).toFixed(2)}</span>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {entry.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {completedEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No completed orders yet.
                </div>
              )}
              {completedEntries.length > 20 && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  Showing latest 20 orders. Total: {completedEntries.length} orders.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
