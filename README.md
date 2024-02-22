# Google Maps API Aggregator

This project is a Google Maps API aggregator that accepts CSV or XLSX files and queries the Google Maps API for the latitude, longitude, and Google Maps URL of each address. Please note that this project is still in development and is not yet ready for production.

## Features

- Accepts CSV or XLSX files with addresses
- Queries the Google Maps API for each address
- Returns the latitude, longitude, and Google Maps URL for each address

## Setup

1. Clone this repository:

```bash
git clone https://github.com/c4lyp5o/maps-aggregator.git
```

2. Install the required packages:

```bash
yarn install
```

3. Create a `.env` file in the root of the project with the following content:

```env
GEOCODE_API_KEY=your_api_key
```

Replace `your_api_key` with your Google Maps API key.

4. Run the project:

```bash
yarn start
```

## Usage

To use this API aggregator, send a GET request to the /geocode endpoint with the alamat, daerah, and negeri query parameters. For example:

```bash
GET /geocode?alamat=Jalan+PJS+11%2F28&daerah=Bandar+Sunway&negeri=Selangor
```

This server will respond with a JSON object containing the latitude, longitude, and Google Maps URL for the address:

```json
{
  "latitude": 3.0757,
  "longitude": 101.6043,
  "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=3.0757,101.6043"
}
```

## Contributing

To contribute to this project, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`.
4. Push to the original branch: `git push origin <project_name>/<location>`.
5. Create the pull request.

## License

This project uses the following license: [MIT](LICENSE).
