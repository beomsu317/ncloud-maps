---
name: ncloud-maps
description: Query Naver Cloud Platform Maps APIs for route navigation and geocoding. Use when you need to find driving routes, calculate distance/duration/tolls, or convert addresses to coordinates. Automatically converts addresses to coordinates using Geocoding API before finding routes. Supports waypoints, route options, vehicle types, and fuel settings.
---

# Ncloud Maps

Query Naver Cloud Maps APIs for routing (Directions15) and address-to-coordinate conversion (Geocoding).

## Setup

1. **Get API credentials from Naver Cloud Console:**
   - Create/register an Application in Naver Cloud Console
   - Obtain `Client ID` (API Key ID) and `Client Secret` (API Key)
   - Enable "Maps Geocoding" and "Maps Directions15" APIs

2. **Set environment variables (or use .env file):**

```bash
export NCLOUD_API_KEY_ID="your-api-key-id"
export NCLOUD_API_KEY="your-api-key-secret"
```

Or create a `.env` file:
```
NCLOUD_API_KEY_ID=your-api-key-id
NCLOUD_API_KEY=your-api-key-secret
```

3. **Install dependencies:**

```bash
cd ~/.openclaw/workspace/skills/ncloud-maps
npm install
```

## Usage

### Basic route query by address (Geocoding → Directions15)

```bash
npx ts-node scripts/index.ts \
  --start "강남역" \
  --goal "신도림역"
```

Automatically resolves both addresses to coordinates, then queries the route.

### Route query by coordinates (direct)

```bash
npx ts-node scripts/index.ts \
  --start "127.0683,37.4979" \
  --goal "126.9034,37.5087"
```

### With waypoints (addresses or coordinates)

```bash
npx ts-node scripts/index.ts \
  --start "강남역" \
  --goal "신도림역" \
  --waypoints "서울역"
```

Mixed format also works:
```bash
npx ts-node scripts/index.ts \
  --start "127.0683,37.4979" \
  --goal "신도림역" \
  --waypoints "126.9700,37.5650"
```

### Route options

Choose from: `trafast` (fast), `tracomfort` (comfort), `traoptimal` (default), `traavoidtoll` (toll-free), `traavoidcaronly` (avoid car-only roads)

```bash
npx ts-node scripts/index.ts \
  --start "강남역" \
  --goal "신도림역" \
  --option "traavoidtoll"
```

### Vehicle and fuel settings

```bash
npx ts-node scripts/index.ts \
  --start "강남역" \
  --goal "신도림역" \
  --cartype 2 \
  --fueltype "diesel" \
  --mileage 10.5
```

Vehicle types:
- `1` (default): Small sedan
- `2`: Medium van/cargo
- `3`: Large vehicle
- `4`: 3-axle cargo truck
- `5`: 4+ axle special cargo
- `6`: Compact car

Fuel types: `gasoline` (default), `highgradegasoline`, `diesel`, `lpg`

## Output

```json
{
  "success": true,
  "start": "강남역",
  "goal": "신도림역",
  "distance": 12850,
  "duration": 1145000,
  "toll_fare": 0,
  "taxi_fare": 18600,
  "fuel_price": 1550,
  "departure_time": "2026-02-21T14:10:00"
}
```

### Response Fields

- `success` - Whether the query succeeded
- `start` - Starting point (input address or coordinates)
- `goal` - Destination (input address or coordinates)
- `distance` - Total distance in meters
- `duration` - Total duration in milliseconds (÷1000 = seconds)
- `toll_fare` - Toll/highway fare in KRW
- `taxi_fare` - Estimated taxi fare in KRW
- `fuel_price` - Estimated fuel cost in KRW
- `departure_time` - Query timestamp
- `error` - Error message (if success=false)

## How It Works

1. **Address Resolution (Geocoding)**
   - Input: User provides address (e.g., "강남역") or coordinates (e.g., "127.0683,37.4979")
   - If address → Geocoding API converts to coordinates
   - If coordinates → Used directly

2. **Route Calculation (Directions15)**
   - Resolved coordinates sent to Directions15 API
   - Returns distance, duration, tolls, taxi fare, fuel cost

3. **Waypoints Support**
   - Each waypoint resolved individually (address or coordinate)
   - All resolved coordinates sent to Directions15

## Environment Variables

**Required:**
- `NCLOUD_API_KEY_ID` - Naver Cloud API Key ID
- `NCLOUD_API_KEY` - Naver Cloud API Key Secret

## API Limits

- Max 10 destination alternatives (via `:` separator in goal)
- Max 5 waypoints (via `|` separator)
- Real-time traffic information included
- Geocoding: 10 results per query (configurable)
- Request rate limits apply per your Naver Cloud plan

## Error Handling

Common errors:
- `Could not resolve start/goal location` - Address not found (try different spelling/format)
- `Authentication Failed` - Invalid API credentials
- `Quota Exceeded` - API rate limit hit
- `No routes found` - No valid route between points

Check Naver Cloud Console for:
- API enablement for your application
- Quota/rate limit status
- Valid coordinates/addresses

## References

See [api-spec.md](references/api-spec.md) for detailed API specifications.
