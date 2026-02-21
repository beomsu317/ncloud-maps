/**
 * Directions5 API - Calculate routes (max 5 waypoints)
 */

import axios, { AxiosError } from "axios";
import { resolveLocation } from "./geocoding";

/**
 * Directions5 API Types (same as Directions15)
 */
export interface Directions5Params {
  start: string;
  goal: string;
  apiKeyId: string;
  apiKey: string;
  waypoints?: string;
  option?: string;
  cartype?: number;
  fueltype?: string;
  mileage?: number;
  lang?: string;
}

export interface RouteOption {
  summary: {
    start: { location: [number, number] };
    goal: { location: [number, number]; dir: number };
    distance: number;
    duration: number;
    departureTime: string;
    bbox: [[number, number], [number, number]];
    tollFare: number;
    taxiFare: number;
    fuelPrice: number;
  };
  path: Array<[number, number]>;
  section: Array<{
    pointIndex: number;
    pointCount: number;
    distance: number;
    name: string;
    congestion: number;
    speed: number;
  }>;
  guide: Array<{
    pointIndex: number;
    type: number;
    instructions: string;
    distance: number;
    duration: number;
  }>;
}

export interface Directions5Response {
  code: number;
  message: string;
  currentDateTime: string;
  route: {
    [option: string]: RouteOption[];
  };
}

export interface ResultOutput {
  success: boolean;
  start: string;
  goal: string;
  distance: number;
  duration: number;
  toll_fare: number;
  taxi_fare: number;
  fuel_price: number;
  departure_time: string;
  error?: string;
}

/**
 * Directions5 API를 호출하여 경로 검색 (최대 5개 경유지)
 */
export async function getDirections5(params: Directions5Params): Promise<ResultOutput> {
  const url = "https://maps.apigw.ntruss.com/map-direction/v1/driving";
  const headers = {
    "x-ncp-apigw-api-key-id": params.apiKeyId,
    "x-ncp-apigw-api-key": params.apiKey,
  };

  // 출발지, 도착지, 경유지를 좌표로 변환
  console.log("\n🔍 [1단계] 위치 정보 변환 (Geocoding)\n");
  
  console.log(`📌 출발지: "${params.start}"`);
  const startCoord = await resolveLocation(params.start, params.apiKeyId, params.apiKey);
  if (!startCoord) {
    return {
      success: false,
      start: params.start,
      goal: params.goal,
      distance: 0,
      duration: 0,
      toll_fare: 0,
      taxi_fare: 0,
      fuel_price: 0,
      departure_time: "",
      error: `출발지 해석 실패: ${params.start}`,
    };
  }

  console.log(`\n📌 도착지: "${params.goal}"`);
  const goalCoord = await resolveLocation(params.goal, params.apiKeyId, params.apiKey);
  if (!goalCoord) {
    return {
      success: false,
      start: params.start,
      goal: params.goal,
      distance: 0,
      duration: 0,
      toll_fare: 0,
      taxi_fare: 0,
      fuel_price: 0,
      departure_time: "",
      error: `도착지 해석 실패: ${params.goal}`,
    };
  }

  // 경유지가 있으면 변환 (최대 5개)
  let waypointsCoord = "";
  if (params.waypoints) {
    const waypointsList = params.waypoints.split("|");
    
    // Directions5는 최대 5개 경유지만 지원
    if (waypointsList.length > 5) {
      return {
        success: false,
        start: params.start,
        goal: params.goal,
        distance: 0,
        duration: 0,
        toll_fare: 0,
        taxi_fare: 0,
        fuel_price: 0,
        departure_time: "",
        error: `Directions5는 최대 5개 경유지만 지원합니다. 요청된 경유지: ${waypointsList.length}개 (더 많은 경유지는 Directions15 사용)`,
      };
    }

    console.log(`\n📌 경유지: "${params.waypoints}"`);
    const resolvedWaypoints: string[] = [];

    for (let i = 0; i < waypointsList.length; i++) {
      const waypoint = waypointsList[i];
      console.log(`  경유지 ${i + 1}: "${waypoint}"`);
      const waypointCoord = await resolveLocation(waypoint, params.apiKeyId, params.apiKey);
      if (waypointCoord) {
        resolvedWaypoints.push(`${waypointCoord.lon},${waypointCoord.lat}`);
      }
    }

    waypointsCoord = resolvedWaypoints.join("|");
  }

  // Directions5 API 호출
  console.log("\n🗺️ [2단계] 경로 검색 (Directions5 API)\n");

  const query: Record<string, any> = {
    start: `${startCoord.lon},${startCoord.lat}`,
    goal: `${goalCoord.lon},${goalCoord.lat}`,
  };

  console.log(`  출발지 좌표: ${query.start}`);
  console.log(`  도착지 좌표: ${query.goal}`);

  if (waypointsCoord) {
    query.waypoints = waypointsCoord;
    console.log(`  경유지 좌표: ${waypointsCoord}`);
  }
  if (params.option) {
    query.option = params.option;
    console.log(`  경로 옵션: ${params.option}`);
  }
  if (params.cartype) query.cartype = params.cartype;
  if (params.fueltype) query.fueltype = params.fueltype;
  if (params.mileage) query.mileage = params.mileage;
  if (params.lang) query.lang = params.lang;

  try {
    const response = await axios.get<Directions5Response>(url, {
      headers,
      params: query,
    });

    const data = response.data;

    if (data.code !== 0) {
      return {
        success: false,
        start: params.start,
        goal: params.goal,
        distance: 0,
        duration: 0,
        toll_fare: 0,
        taxi_fare: 0,
        fuel_price: 0,
        departure_time: "",
        error: `API 에러: ${data.message}`,
      };
    }

    // traoptimal이 기본값, 없으면 첫번째 옵션 사용
    const optionKey = Object.keys(data.route)[0];
    const routes = data.route[optionKey];

    if (!routes || routes.length === 0) {
      return {
        success: false,
        start: params.start,
        goal: params.goal,
        distance: 0,
        duration: 0,
        toll_fare: 0,
        taxi_fare: 0,
        fuel_price: 0,
        departure_time: "",
        error: "경로 정보 없음",
      };
    }

    const summary = routes[0].summary;

    console.log("\n✅ [3단계] 결과\n");

    return {
      success: true,
      start: params.start,
      goal: params.goal,
      distance: summary.distance,
      duration: summary.duration,
      toll_fare: summary.tollFare,
      taxi_fare: summary.taxiFare,
      fuel_price: summary.fuelPrice,
      departure_time: summary.departureTime,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    return {
      success: false,
      start: params.start,
      goal: params.goal,
      distance: 0,
      duration: 0,
      toll_fare: 0,
      taxi_fare: 0,
      fuel_price: 0,
      departure_time: "",
      error: axiosError.message || "알 수 없는 에러",
    };
  }
}
