export const mockAuth = {
  currentUser: {
    id: 1,
    email: "user@example.com",
    full_name: "John Doe",
    phone: "+1234567890"
  },
  
  updateUser: (data) => {
    Object.assign(mockAuth.currentUser, data);
    return mockAuth.currentUser;
  },
  
  logout: () => {
    console.log("🚪 User logged out");
    
    // Clear user data from session/local storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Reset current user
    mockAuth.currentUser = {
      id: 1,
      email: "user@example.com",
      full_name: "John Doe",
      phone: "+1234567890"
    };
    
    // Redirect to home
    window.location.href = "/";
  }
};