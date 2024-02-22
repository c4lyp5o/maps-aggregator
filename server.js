import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Joi from 'joi';
import { parse } from 'csv-parse';
import { Server } from 'hyper-express';
import { Client } from '@googlemaps/google-maps-services-js';

dotenv.config();

const server = new Server();
const client = new Client({});

server.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

const schema = Joi.object({
  Alamat: Joi.string().min(3).required(),
  Daerah: Joi.string().allow(''),
  Negeri: Joi.string().min(3).required(),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

server.get('/geocode', async (req, res) => {
  if (!process.env.GEOCODE_API_KEY) {
    return res.status(400).json({ message: 'API key not found' });
  }

  const { alamat, daerah, negeri } = req.query;

  const { error } = schema.validate({ alamat, daerah, negeri });

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const address = `${alamat}, ${daerah}, ${negeri}`;

  try {
    const response = await client.geocode({
      params: {
        address,
        region: 'my',
        key: process.env.GEOCODE_API_KEY,
      },
    });

    if (response.data.results[0]) {
      const { formatted_address } = response.data.results[0];
      const { lat, lng } = response.data.results[0].geometry.location;

      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      const results = {
        formatted_address,
        latitude: lat,
        longitude: lng,
        url: gmapsUrl,
      };

      console.log(results);

      res.json(results);
    } else {
      res.status(404).json({ message: 'No results' });
    }
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

server.get('/processcsv', async (req, res) => {
  if (!process.env.GEOCODE_API_KEY) {
    return res.status(400).json({ message: 'API key not found' });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'penempatan.csv');
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
    });

    const records = [];

    fs.createReadStream(filePath)
      .pipe(parser)
      .on('data', (record) => {
        const cleanedRecord = {};
        for (const key in record) {
          cleanedRecord[key.replace(/^\ufeff/, '')] = record[key];
        }

        // validate the record
        const { error } = schema.validate(cleanedRecord);
        if (error) {
          console.error(error);
          return res
            .status(400)
            .json({ message: `Invalid record: ${error.details[0].message}` });
        }

        records.push(cleanedRecord);
      })
      .on('end', async () => {
        console.log('CSV file successfully processed');
        console.log('Getting geocodes for the addresses...');

        for (const record of records) {
          const { Alamat, Daerah, Negeri } = record;
          const address = `${Alamat}, ${Daerah}, ${Negeri}`;

          console.log('Processing:', address);

          try {
            const response = await client.geocode({
              params: {
                address,
                region: 'my',
                key: process.env.GEOCODE_API_KEY,
              },
            });

            if (response.data.results[0]) {
              const { formatted_address } = response.data.results[0];
              const { lat, lng } = response.data.results[0].geometry.location;
              const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

              console.log(
                `Geocode: ${formatted_address}, ${lat}, ${lng}, ${gmapsUrl}`
              );

              // record.formatted_address = formatted_address;
              record.Latitud = lat;
              record.Longitud = lng;
              record.Rujukan = gmapsUrl;

              await sleep(5000);
            } else {
              console.error('No results');
            }
          } catch (error) {
            console.error(error);
          }
        }

        // write the records to a new CSV file
        const outputFilePath = path.join(
          process.cwd(),
          'public',
          'penempatan-geocoded.csv'
        );
        const output = fs.createWriteStream(outputFilePath);

        output.write('Alamat,Daerah,Negeri,Latitud,Longitud,Rujukan\n');

        for (const record of records) {
          output.write(
            `${record.Alamat},${record.Daerah},${record.Negeri},${record.Latitud},${record.Longitud},${record.Rujukan}\n`
          );
        }

        output.end();

        console.log('Geocoded CSV file successfully written');
        res.json(records);
      })
      .on('error', (error) => {
        console.error(error);
        res
          .status(500)
          .json({ message: 'An error occurred while processing the CSV file' });
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'An error occurred while processing the CSV file' });
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started at http://localhost:${process.env.PORT || 3000}`);
});
