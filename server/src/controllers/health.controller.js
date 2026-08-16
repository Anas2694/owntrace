function getHealth(_request, response) {
  response.status(200).json({
    success: true,
    message: 'OwnTrace API is running',
  })
}

export { getHealth }
