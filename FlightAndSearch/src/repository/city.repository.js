const { Op, where } = require("sequelize");
const { City } = require("../models/index");

class CityRepository {
    async createCity({ name }) {
        try {
            const city = await City.create({ name });
            return city;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }

    async createCities(data) {
        try {
            // console.log("data", data);
            const cities = await City.bulkCreate(data);
            return cities;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }

    async deleteCity(cityId) {
        try {
            await City.destroy({
                where: {
                    id: cityId
                }
            });
            return true;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }

    async getCity(cityId) {
        try {
            const city = await City.findByPk(cityId);
            return city;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }

    async updateCity(cityId, data) {  // data -> obj
        try {
            // the below approach also work but will not returning update object
            // if we are using postgSQL then returning: true can be used else not work
            // const response = await City.update(data, {
            //     where: {
            //         id: cityId
            //     }
            // })
            const city = await City.findByPk(cityId);
            // await city.update({ name: data.name });
            city.name = data.name;
            await city.save();
            return city;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }


    async getAllCities(filter) { // filter can be empty also
        try {
            if (filter.name) {
                const cities = await City.findAndCountAll({
                    where: {
                        name: {
                            [Op.startsWith]: filter.name,
                        },
                    },
                    // offset: 10,
                    // limit: 2,
                })
                return cities;
            }
            const cities = await City.findAll();
            return cities;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }
}

module.exports = CityRepository;