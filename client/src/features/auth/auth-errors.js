function getRequestErrors(error) {
  return {
    fieldErrors: error.response?.data?.errors || {},
    message:
      error.response?.data?.message ||
      'OwnTrace could not reach the server. Check your connection and try again.',
  }
}

export { getRequestErrors }
