import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Sequelize,
} from '@sequelize/core';
import {
  Attribute,
  AutoIncrement,
  NotNull,
  PrimaryKey,
} from '@sequelize/core/decorators-legacy';
import { SqliteDialect } from '@sequelize/sqlite3';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare firstName: string;

  @Attribute(DataTypes.STRING)
  declare lastName: string | null;
}

const sequelize = new Sequelize({
  dialect: SqliteDialect,
  storage: 'debug/sequelize.sqlite',
  models: [User],
});

describe('sequelize', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  it('should create a user', async () => {
    User.assertIsInitialized();
    await User.create({ firstName: 'John', lastName: 'Doe' });
    const user = await User.findOne({ where: { firstName: 'John' } });
    expect(user).toBeDefined();
    expect(user?.lastName).toBe('Doe');
  });
});
