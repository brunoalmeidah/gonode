'use strict'

const Database = use('Database')
/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const User = use('App/Models/User')

class UserController {
  async store ({ request }) {
    const { permissions, roles, ...data } = request.only([
      'username',
      'email',
      'password',
      'permissions',
      'roles'
    ])
    const addresses = request.input('addresses')

    const trx = await Database.beginTransaction()

    const user = await User.create(data, trx)

    await user.addresses().createMany(addresses, trx)

    if (roles) {
      await user.roles().attach(roles, null, trx)
    }

    if (permissions) {
      await user.permission().attach(permissions, null, trx)
    }

    await trx.commit()

    await user.loadMany(['roles', 'permissions', 'addresses'])
    return user
  }

  async update ({ params, request }) {
    const { permissions, roles, ...data } = request.only([
      'username',
      'email',
      'password',
      'permissions',
      'roles'
    ])
    const addresses = request.input('addresses')

    const user = await User.findOrFail(params.id)

    const trx = await Database.beginTransaction()

    user.merge(data)

    user.save(trx)

    if (addresses) {
      addresses.forEach(async item => {
        await user.addresses().where('id', item.id).update(item, trx)
      })
    }

    if (permissions) {
      await user.permissions().sync(permissions, null, trx)
    }
    if (roles) {
      await user.roles().sync(roles, null, trx)
    }

    await trx.commit()

    const userUpdated = await User.findOrFail(params.id)

    await userUpdated.loadMany(['roles', 'permissions', 'addresses'])

    return userUpdated
  }
}

module.exports = UserController
