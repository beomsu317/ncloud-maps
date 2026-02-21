#!/usr/bin/env node

/**
 * Ncloud Maps Directions15 + Geocoding API CLI
 * 
 * 환경변수:
 *   NCLOUD_API_KEY_ID: 네이버클라우드 API Key ID
 *   NCLOUD_API_KEY: 네이버클라우드 API Key
 * 
 * 사용 예:
 *   npx ts-node scripts/index.ts --start "아현역" --goal "파미르 테니스장"
 *   npx ts-node scripts/index.ts --start "127.1058342,37.359708" --goal "129.075986,35.179470"
 *   npx ts-node scripts/index.ts --start "서울역" --goal "부산역" --waypoints "대전역"
 */

import { getDirections } from "../lib/directions";
import type { DirectionsParams } from "../lib/directions";

async function main() {
  // 환경변수에서 인증 정보 읽기
  const apiKeyId = process.env.NCLOUD_API_KEY_ID;
  const apiKey = process.env.NCLOUD_API_KEY;

  if (!apiKeyId || !apiKey) {
    console.error(
      "❌ 에러: NCLOUD_API_KEY_ID와 NCLOUD_API_KEY 환경변수가 필요합니다.\n"
    );
    process.exit(1);
  }

  // 커맨드라인 argument 파싱
  const args = process.argv.slice(2);
  const params: Partial<DirectionsParams> = {
    apiKeyId,
    apiKey,
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    const value = args[i + 1];

    if (key === "start") params.start = value;
    else if (key === "goal") params.goal = value;
    else if (key === "waypoints") params.waypoints = value;
    else if (key === "option") params.option = value;
    else if (key === "cartype") params.cartype = parseInt(value);
    else if (key === "fueltype") params.fueltype = value;
    else if (key === "mileage") params.mileage = parseFloat(value);
    else if (key === "lang") params.lang = value;
  }

  // 필수 파라미터 검증
  if (!params.start || !params.goal) {
    console.error(
      "❌ 에러: --start와 --goal 파라미터가 필요합니다.\n\n" +
        "사용 방법: index.ts --start <주소 또는 좌표> --goal <주소 또는 좌표> [옵션]\n\n" +
        "예시:\n" +
        "  # 주소로 검색:\n" +
        "  npx ts-node scripts/index.ts --start '아현역' --goal '파미르테니스장'\n" +
        "  npx ts-node scripts/index.ts --start '서울역' --goal '부산역' --waypoints '대전역|전주역'\n\n" +
        "  # 좌표로 검색 (경도,위도):\n" +
        "  npx ts-node scripts/index.ts --start '127.1058342,37.359708' --goal '129.075986,35.179470'\n\n" +
        "  # 혼합:\n" +
        "  npx ts-node scripts/index.ts --start '아현역' --goal '129.075986,35.179470' --option 'traavoidtoll'"
    );
    process.exit(1);
  }

  try {
    const result = await getDirections(params as DirectionsParams);

    if (!result.success) {
      console.error(`\n❌ 실패: ${result.error}`);
      process.exit(1);
    }

    // JSON 형식으로 출력
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`❌ 예상치 못한 에러: ${error}`);
    process.exit(1);
  }
}

main();
