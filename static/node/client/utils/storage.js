export const getStorageType = (key) => {
  let storageType;
  if (window.sessionStorage[key]) storageType = 'sessionStorage';
  else if (window.localStorage[key]) storageType = 'localStorage';
  return storageType;
};

export const setStorage = ({
  data,
  key,
  persistent = false,
}) => {
  const currStorageType = persistent
    ? 'localStorage'
    : 'sessionStorage';
  const prevStorageType = currStorageType === 'sessionStorage'
    ? 'localStorage'
    : 'sessionStorage';
  
  window[prevStorageType].removeItem(key);
  window[currStorageType].setItem(key, JSON.stringify(data));
};
