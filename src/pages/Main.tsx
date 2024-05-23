import { useEffect, useState } from 'react';

import Icon from '../components/Icon/icon';
import { geolocation } from '../utils/getLocation';

const DummyData = [
  {
    id: 1,
    date: '2021.01.01 (목)',
    trash: 3,
    runTime: '28:12',
    kcal: 133.6,
    distance: 1.43,
  },
  {
    id: 2,
    date: '2021.01.02 (금)',
    trash: 4,
    runTime: '30:12',
    kcal: 143.6,
    distance: 1.53,
  },
  {
    id: 3,
    date: '2021.01.03 (토)',
    trash: 5,
    runTime: '31:12',
    kcal: 153.6,
    distance: 1.63,
  },
];

const Main = () => {
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    long: number;
  }>({ lat: 0, long: 0 });
  const [address, setAddress] = useState<string>('서귀포시 성산읍');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGeolocation = async () => {
      try {
        const coords = await geolocation.get();
        if (coords) {
          setCoordinates(coords);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeolocation();
  }, []);

  useEffect(() => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(
      coordinates.long,
      coordinates.lat,
      (result: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          if (result[0].length !== 0) {
            setAddress(
              result[0].address.address_name.split(' ').slice(1, 3).join(' '),
            );
          }
        }
      },
    );
  }, [coordinates]);

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-5 p-6 pt-[60px]'>
      <span className='text-[30px]'>{address}</span>
      <span className='text-gray-500'>최근 플로깅</span>
      <div className='flex flex-col gap-6'>
        {DummyData.map((data, index) => (
          <div
            key={`${data.id} - ${index}`}
            className='flex flex-col gap-4 rounded-md border p-4'
          >
            <div className='flex items-center justify-between'>
              <span>{data.date}</span>
              <span className='flex items-center gap-2'>
                <Icon id='leaf' className='text-green-600' /> {data.trash}
              </span>
            </div>
            <div className='flex w-full items-center justify-between'>
              <span className='flex items-center gap-1'>
                <Icon id='time' />
                {data.runTime}
              </span>
              <span>{`${data.kcal} Kcal`}</span>
              <span>{`${data.distance} Km`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Main;
