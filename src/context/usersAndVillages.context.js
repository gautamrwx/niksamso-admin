import { createContext, useContext, useEffect, useState } from 'react';
import { useProfile } from './profile.context';
import { db } from '../misc/firebase';
import { onValue, ref } from 'firebase/database';

const usersAndVillages = createContext();

export const UsersAndVillagesProvider = ({ children }) => {

    const { profile } = useProfile();

    const [users, setUsers] = useState([]);
    const [villages, setVillages] = useState([]);

    useEffect(() => {
        if (!profile) return;

        // Fetch Users and Set
        const usersRef = ref(db, 'users/');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const userList = [];
                Object.keys(data).map(x => userList.push({ key: x, ...data[x] }));
                setUsers(userList);
            }
        });

        // Fetch Village Group 
        const villageGroupRef = ref(db, 'villageGroupList/');
        onValue(villageGroupRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const villages = [];
                Object.keys(data).map(villGroupKey => (
                    Object.keys(data[villGroupKey]).map(villageKey =>
                        villages.push({ key: villageKey, villGroupKey: villGroupKey, ...data[villGroupKey][villageKey] })
                    )
                ));

                setVillages(villages);
            }
        });

    }, [profile]);

    return (
        <usersAndVillages.Provider value={{ users, villages }}>
            {children}
        </usersAndVillages.Provider>
    );
};

export const useUsersAndVillages = () => useContext(usersAndVillages);
