/**
 * Geocoding API - Convert addresses to coordinates
 */

import axios, { AxiosError } from "axios";

/**
 * Geocoding API Response Types
 */
export interface GeocodeAddress {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  x: string;
  y: string;
  distance: number;
}

export interface GeocodeResponse {
  status: string;
  meta: {
    totalCount: number;
    page: number;
    count: number;
  };
  addresses: GeocodeAddress[];
  errorMessage: string;
}

export interface GeocodeParams {
  query: string;
  apiKeyId: string;
  apiKey: string;
  coordinate?: string;
  language?: string;
  count?: number;
}

/**
 * Geocoding API 호출 - 주소를 좌표로 변환
 */
export async function geocodeAddress(params: GeocodeParams): Promise<{ lon: string; lat: string } | null> {
  const url = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";
  const headers = {
    "x-ncp-apigw-api-key-id": params.apiKeyId,
    "x-ncp-apigw-api-key": params.apiKey,
    Accept: "application/json",
  };

  const query: Record<string, any> = {
    query: params.query,
  };

  if (params.coordinate) query.coordinate = params.coordinate;
  if (params.language) query.language = params.language;
  if (params.count) query.count = params.count;

  try {
    console.log(`  📍 Geocoding API 호출: "${params.query}"`);
    const response = await axios.get<GeocodeResponse>(url, {
      headers,
      params: query,
    });

    const data = response.data;

    console.log(`  📊 API 응답 상태: ${data.status}`);
    console.log(`  📊 결과 개수: ${data.meta.totalCount}`);
    console.log(`  📊 응답 전체: ${JSON.stringify(data, null, 2)}`);

    if (data.status !== "OK" || data.addresses.length === 0) {
      console.error(`  ❌ Geocoding 실패: "${params.query}" (상태: ${data.status}, 결과: ${data.addresses.length})`);
      if (data.errorMessage) {
        console.error(`     오류 메시지: ${data.errorMessage}`);
      }
      return null;
    }

    // 첫 번째 결과 사용
    const address = data.addresses[0];
    console.log(`  ✅ 변환 완료: "${params.query}" → (${address.x}, ${address.y})`);
    console.log(`     주소: ${address.roadAddress}`);
    
    return {
      lon: address.x,
      lat: address.y,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(`  ❌ Geocoding API 에러: ${axiosError.message}`);
    console.error(`     상태 코드: ${axiosError.status}`);
    console.error(`     응답: ${JSON.stringify(axiosError.response?.data)}`);
    return null;
  }
}

/**
 * 좌표 문자열인지 확인 (경도,위도 형식)
 */
export function isCoordinate(str: string): boolean {
  const parts = str.split(",");
  if (parts.length !== 2) return false;
  const lon = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  return !isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

/**
 * 입력값을 좌표로 변환 (주소 또는 좌표)
 */
export async function resolveLocation(
  input: string,
  apiKeyId: string,
  apiKey: string
): Promise<{ lon: string; lat: string } | null> {
  // 이미 좌표 형식이면 그대로 반환
  if (isCoordinate(input)) {
    console.log(`  ✅ 좌표 형식 입력 (변환 불필요): (${input})`);
    const [lon, lat] = input.split(",");
    return { lon, lat };
  }

  // 주소이면 Geocoding으로 변환
  const result = await geocodeAddress({
    query: input,
    apiKeyId,
    apiKey,
  });

  if (!result) {
    console.error(`  ❌ 위치 해석 실패: "${input}"`);
  }

  return result;
}
