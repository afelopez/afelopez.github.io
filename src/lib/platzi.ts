import { Certificate } from '../data/certificates';

interface PlatziCourse {
  id: number;
  title: string;
  badge_url?: string;
  diploma: {
    diploma_url: string;
    approved_date: string;
  };
}

interface PlatziResponse {
  data: {
    courses: PlatziCourse[];
  };
}

export async function getPlatziDiplomas(username: string): Promise<Certificate[]> {
  try {
    const res = await fetch(
      `https://api.platzi.com/students/v1/diplomas/${username}/?page=1&page_size=100`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: `https://platzi.com/p/${username}/`,
          Origin: 'https://platzi.com',
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Platzi responded with ${res.status}`);
    }
    const { data }: PlatziResponse = await res.json();

    return data.courses
      .filter((course) => course?.diploma?.approved_date && course?.diploma?.diploma_url)
      .map((course) => ({
        id: `platzi-${course.id}`,
        title: course.title,
        issuer: 'Platzi',
        provider: 'platzi',
        date: course.diploma.approved_date,
        url: course.diploma.diploma_url,
        image: course.badge_url,
      }));
  } catch (err) {
    console.warn(`[certificates] Failed to fetch Platzi diplomas for "${username}":`, err);
    return [];
  }
}
