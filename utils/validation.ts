// Simple age validation
export const isOver18 = (dateString: string): boolean => {
  const today = new window.Date();
  const birthDate = new window.Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18;
};

// Basic CPF formatting (XXX.XXX.XXX-XX)
export const formatCPF = (value: string): string => {
  const numeric = value.replace(/\D/g, '');
  return numeric
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// Basic Phone formatting ((XX) XXXXX-XXXX)
export const formatPhone = (value: string): string => {
  const numeric = value.replace(/\D/g, '');
  return numeric
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const formatPixKey = (value: string): string => {
  return value; // Logic would vary based on type selected
};