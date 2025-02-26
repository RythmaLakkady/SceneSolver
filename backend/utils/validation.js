export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  console.log("Validating password:", password?.length >= 6);
  return password && password.length >= 6;
};
